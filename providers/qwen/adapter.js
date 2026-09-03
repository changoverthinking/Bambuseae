// Adapter Qwen; không chứa credential phía trình duyệt.
const adapter = {
  id: "qwen",
  protocol: "openai-compatible",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: { provider: "qwen", model: model.id, messages, project, skills, plugins }
    };
  }
};

export default adapter;
