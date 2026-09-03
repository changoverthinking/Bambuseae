// Adapter DeepSeek; định dạng provider cụ thể nằm ở API gateway.
const adapter = {
  id: "deepseek",
  protocol: "openai-compatible",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: { provider: "deepseek", model: model.id, messages, project, skills, plugins }
    };
  }
};

export default adapter;
