// Adapter Mistral; gateway chuẩn hóa request/response và usage.
const adapter = {
  id: "mistral",
  protocol: "openai-compatible",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: { provider: "mistral", model: model.id, messages, project, skills, plugins }
    };
  }
};

export default adapter;
