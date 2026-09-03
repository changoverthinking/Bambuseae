// Adapter xAI/Grok; gateway chịu trách nhiệm chọn model và giữ API key.
const adapter = {
  id: "xai",
  protocol: "openai-compatible",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: { provider: "xai", model: model.id, messages, project, skills, plugins }
    };
  }
};

export default adapter;
