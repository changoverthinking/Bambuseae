// Adapter đánh dấu model local. app.js xử lý trực tiếp để không gọi gateway.
export default {
  kind: "local-simulation",
  buildGatewayRequest() {
    throw new Error("LOCAL_MODEL_DOES_NOT_USE_GATEWAY");
  }
};
