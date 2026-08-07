"""Deployment authentication extension supporting revocable per-client keys."""
import hmac

from hindsight_api.config import get_config
from hindsight_api.extensions.tenant import (
    AuthenticationError,
    Tenant,
    TenantContext,
    TenantExtension,
)
from hindsight_api.models import RequestContext


class MultiApiKeyTenantExtension(TenantExtension):
    """Accept one owner key and optional comma-separated client keys."""

    def __init__(self, config: dict[str, str]):
        super().__init__(config)
        owner_key = config.get("api_key", "").strip()
        additional = tuple(
            value.strip()
            for value in config.get("additional_api_keys", "").split(",")
            if value.strip()
        )
        if not owner_key:
            raise ValueError("HINDSIGHT_API_TENANT_API_KEY is required")
        self._keys = (owner_key, *additional)

    async def authenticate(self, context: RequestContext) -> TenantContext:
        supplied = context.api_key or ""
        if not supplied or not any(hmac.compare_digest(supplied, key) for key in self._keys):
            raise AuthenticationError("Invalid API key")
        return TenantContext(schema_name=get_config().database_schema)

    async def authenticate_mcp(self, context: RequestContext) -> TenantContext:
        return await self.authenticate(context)

    async def list_tenants(self) -> list[Tenant]:
        return [Tenant(schema=get_config().database_schema)]
