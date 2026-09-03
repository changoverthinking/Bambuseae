// Adapter Cohere; gateway chuẩn hóa messages và usage về Bambuseae.
const adapter = {
  id: "cohere",
  protocol: "cohere-chat",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: { provider: "cohere", model: model.id, messages, project, skills, plugins }
    };
  }
};

export default adapter;
