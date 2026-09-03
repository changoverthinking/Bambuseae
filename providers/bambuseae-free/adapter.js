// Adapter phía giao diện cho AI dùng chung Bambuseae.
// API key thật chỉ được dùng ở backend, không đặt trong thư mục này.
const adapter = {
  id: "bambuseae-free",
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
