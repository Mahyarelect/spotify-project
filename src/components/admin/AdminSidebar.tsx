import {
  UserCheck,
  MessageSquare,
  DollarSign,
  CreditCard,
  BarChart3,
  Shield,
} from "lucide-react";

export type AdminSection =
  | "verification"
  | "tickets"
  | "audit"
  | "pricing"
  | "revenue";

interface AdminSidebarProps {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
  isSuperAdmin: boolean;
}

const ITEMS: {
  key: AdminSection;
  label: string;
  icon: typeof Shield;
  adminOnly?: boolean;
}[] = [
  { key: "verification", label: "Artist Verification", icon: UserCheck },
  { key: "tickets", label: "Support Tickets", icon: MessageSquare },
  { key: "audit", label: "Audit & Payments", icon: DollarSign },
  { key: "pricing", label: "Subscription Pricing", icon: CreditCard, adminOnly: true },
  { key: "revenue", label: "Revenue Overview", icon: BarChart3, adminOnly: true },
];

export function AdminSidebar({ active, onChange, isSuperAdmin }: AdminSidebarProps) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-zinc-800 pb-px lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
      {ITEMS.map((item) => {
        if (item.adminOnly && !isSuperAdmin) return null;
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
              isActive
                ? "bg-green-500/10 text-green-400"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
