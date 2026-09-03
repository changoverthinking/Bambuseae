// Adapter Anthropic. Việc đổi định dạng request/response nằm ở gateway.
const adapter = {
  id: "claude-personal",
  protocol: "anthropic-messages",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: {
        provider: "anthropic",
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
