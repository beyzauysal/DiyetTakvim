const express = require("express");

const router = express.Router();

router.post("/", (req, res) => {
  res.status(400).json({
    message:
      "Danışan–diyetisyen eşleştirmesi POST /auth/register ile davet kodu kullanılarak yapılır.",
    hint: "Diyetisyen davet kodunu POST /invite-code veya kayıt sonrası profilden paylaşır.",
  });
});

module.exports = router;
