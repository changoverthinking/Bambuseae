// Adapter Perplexity; gateway chịu trách nhiệm xử lý tìm kiếm và trích dẫn.
const adapter = {
  id: "perplexity",
  protocol: "openai-compatible",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: { provider: "perplexity", model: model.id, messages, project, skills, plugins }
    };
  }
};

export default adapter;
