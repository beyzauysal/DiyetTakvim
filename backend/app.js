module.exports = async function handler(req, res) {
  console.log("MINIMAL_APP_JS_HIT", req.method, req.url);

  return res.status(200).json({
    ok: true,
    service: "DiyetTakvim API",
    message: "Minimal Vercel handler works",
  });
};
