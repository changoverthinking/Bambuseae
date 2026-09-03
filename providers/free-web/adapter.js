// AI web miễn phí không gọi API từ GitHub Pages.
// Adapter tồn tại để registry giữ cấu trúc provider nhất quán.
const adapter = {
  id: "free-web",
  protocol: "official-web-link",
  buildGatewayRequest({ model }) {
    return { path: model.webUrl, method: "GET", body: null };
  }
};

export default adapter;
