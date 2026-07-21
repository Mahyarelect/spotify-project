class DomainError(Exception):
    def __init__(self, code: str, message: str, *, status_code: int = 400, fields=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.fields = fields
