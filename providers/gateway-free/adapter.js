// Adapter chung cho các API free-tier. Backend phải kiểm tra provider trước khi gọi.
const adapter = {
  id: "gateway-free",
  protocol: "provider-aware-gateway",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: {
        provider: model.gatewayProvider || model.provider,
        model: model.id,
        messages,
        project,
        skills,
        plugins
      }
    };
  }
};

export default adapter;
