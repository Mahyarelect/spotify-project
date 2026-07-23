from drf_spectacular.generators import SchemaGenerator


def test_profile_patch_schema_uses_optional_binary_avatar_multipart_request():
    schema = SchemaGenerator().get_schema(request=None, public=True)
    patch = schema["paths"]["/api/v1/users/me/"]["patch"]
    multipart = patch["requestBody"]["content"]["multipart/form-data"]["schema"]
    component_name = multipart["$ref"].rsplit("/", 1)[-1]
    request_schema = schema["components"]["schemas"][component_name]

    avatar = request_schema["properties"]["avatar"]
    assert avatar["type"] == "string"
    assert avatar["format"] == "binary"
    assert not request_schema.get("required")
