// Adapter cho AI dự phòng. Vẫn đi qua gateway để giữ cùng một Thread.
const adapter = {
  id: "bambuseae-fast",
  protocol: "bambuseae-gateway",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: {
        provider: "bambuseae",
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
