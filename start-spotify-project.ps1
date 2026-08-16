"""Theory V1: explicit belief features only; no reward shaping."""

import numpy as np

from see.training.theory_api import TheorySpec


# Observation indices
T_FRAC = 0


class MyTheory(TheorySpec):
    """
    First theory experiment.

    We make beliefs about the opponent explicit while keeping reward
    shaping equal to zero. This lets us compare belief features directly
    against the null baseline.
    """

    name = "beliefs-v1"

    # Four theory-derived belief features are appended to the normal
    # 16-dimensional observation.
    extra_feature_dim = 4

    def on_episode_start(self, player_id):
        # V1 reconstructs its beliefs directly from public history,
        # so no additional hidden state is required.
        pass

    @staticmethod
    def _other(player_id):
        if player_id == "I":
            return "U"
        return "I"

    def extra_features(self, player_id, obs, public_state):
        opp = self._other(player_id)

        # --------------------------------------------------------------
        # FEATURE 1:
        # Bayesian belief that the opponent is a high-endurance type.
        #
        # H = high-endurance / high-resolve opponent
        # L = low-endurance / low-resolve opponent
        #
        # Start with an uninformative prior:
        # P(H) = P(L) = 0.5
        # --------------------------------------------------------------
        log_odds = 0.0

        signal_levels = np.asarray(
            [0.0, 0.25, 0.50, 0.75, 1.0],
            dtype=np.float32
        )

        # Stronger signals are assumed to be relatively more likely
        # under H because the model's single-crossing condition makes
        # strong signals relatively cheaper for stronger types.
        likelihood_H = np.asarray(
            [0.10, 0.15, 0.20, 0.25, 0.30],
            dtype=np.float32
        )

        likelihood_L = np.asarray(
            [0.30, 0.25, 0.20, 0.15, 0.10],
            dtype=np.float32
        )

        # Public commitment stocks are reconstructed from history.
        K = {
            "I": 0.0,
            "U": 0.0
        }

        delta_K = 0.75

        pressure_sum = 0.0
        pressure_count = 0

        history = public_state.get("history", [])

        for h in history:
            sigma = h.get("sigma", {})

            my_sigma = float(
                sigma.get(player_id, 0.0)
            )

            opp_sigma = float(
                sigma.get(opp, 0.0)
            )

            active = h.get("active", [])

            opp_exited = bool(
                h.get("exit", {}).get(opp, False)
            )

            # ----------------------------------------------------------
            # FEATURE EVIDENCE:
            # Approximate public pressure faced by the opponent.
            #
            # It combines:
            #   - pressure from our signal,
            #   - opponent accumulated commitment,
            #   - joint escalation.
            #
            # This does NOT use the opponent's hidden endurance or type.
            # ----------------------------------------------------------
            opp_commitment = np.clip(
                K[opp] / 4.0,
                0.0,
                1.0
            )

            pressure = (
                0.45 * my_sigma
                + 0.30 * opp_commitment
                + 0.25 * my_sigma * opp_sigma
            )

            pressure = float(
                np.clip(pressure, 0.0, 1.0)
            )

            pressure_sum += pressure
            pressure_count += 1

            # Only use the signal as new evidence when the opponent
            # actually had an opportunity to choose an action.
            #
            # HOLD is not treated as a newly chosen costly signal.
            if opp in active and not opp_exited:

                index = int(
                    np.argmin(
                        np.abs(signal_levels - opp_sigma)
                    )
                )

                # Bayesian likelihood-ratio update from signal strength.
                log_odds += float(
                    np.log(
                        likelihood_H[index]
                        / likelihood_L[index]
                    )
                )

                # Continuing under stronger public pressure is treated
                # as additional evidence of endurance.
                #
                # At low pressure, H and L behave similarly.
                # At high pressure, continuation is assumed to be more
                # likely for H than for L.
                p_continue_H = (
                    0.72 + 0.18 * pressure
                )

                p_continue_L = (
                    0.72 - 0.22 * pressure
                )

                log_odds += float(
                    np.log(
                        p_continue_H
                        / p_continue_L
                    )
                )

            # Reconstruct the public commitment transition:
            #
            # K_i(t+1) = 0.75 K_i(t) + sigma_i(t)
            K[player_id] = (
                delta_K * K[player_id]
                + my_sigma
            )

            K[opp] = (
                delta_K * K[opp]
                + opp_sigma
            )

        # Keep numerical values stable.
        log_odds = float(
            np.clip(log_odds, -8.0, 8.0)
        )

        # Convert log odds into posterior probability.
        p_high = (
            1.0
            / (1.0 + np.exp(-log_odds))
        )

        # --------------------------------------------------------------
        # FEATURE 2:
        # Average public pressure that the opponent has survived.
        # --------------------------------------------------------------
        avg_pressure = (
            pressure_sum
            / max(pressure_count, 1)
        )

        # --------------------------------------------------------------
        # FEATURE 3:
        # Estimated current opponent endurance.
        #
        # We do not observe true opponent endurance.
        # Instead, construct a belief proxy from:
        #   posterior type probability,
        #   elapsed time,
        #   public pressure.
        # --------------------------------------------------------------
        t_frac = float(
            np.clip(obs[T_FRAC], 0.0, 1.0)
        )

        high_type_path = (
            1.0 - 0.30 * t_frac
        )

        low_type_path = (
            1.0 - 0.65 * t_frac
        )

        endurance_proxy = (
            p_high * high_type_path
            + (1.0 - p_high) * low_type_path
            - 0.20 * avg_pressure * t_frac
        )

        endurance_proxy = float(
            np.clip(
                endurance_proxy,
                0.0,
                1.0
            )
        )

        # --------------------------------------------------------------
        # FEATURE 4:
        # Confidence in the high/low belief.
        #
        # confidence = 0 when posterior = 0.5
        # confidence approaches 1 when posterior approaches 0 or 1.
        # --------------------------------------------------------------
        confidence = (
            1.0
            - 4.0
            * p_high
            * (1.0 - p_high)
        )

        confidence = float(
            np.clip(
                confidence,
                0.0,
                1.0
            )
        )

        return np.asarray(
            [
                p_high,
                avg_pressure,
                endurance_proxy,
                confidence,
            ],
            dtype=np.float32
        )

    def shaping(
        self,
        player_id,
        obs,
        action,
        env_reward,
        next_obs,
        next_public,
        terminated
    ):
        # No shaping in Experiment V1.
        #
        # This allows us to isolate whether explicit belief features
        # improve learning relative to the null baseline.
        return 0.0