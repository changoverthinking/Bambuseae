// Adapter Meta/Llama; có thể dùng gateway OpenAI-compatible hoặc self-hosted.
const adapter = {
  id: "meta",
  protocol: "openai-compatible",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: { provider: "meta", model: model.id, messages, project, skills, plugins }
    };
  }
};

export default adapter;
