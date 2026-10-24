from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ApiError(Exception):
    """An error we choose to show the client. Rendered as {"error": {"code", "message"}}."""

    def __init__(self, status: int, code: str, message: str, headers: dict[str, str] | None = None):
        self.status = status
        self.code = code
        self.message = message
        self.headers = headers


def _body(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(_body(exc.code, exc.message), exc.status, headers=exc.headers)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        first = exc.errors()[0]
        field = ".".join(str(p) for p in first["loc"] if p not in ("query", "body"))
        return JSONResponse(_body("validation_error", f"{field}: {first['msg']}"), 422)
