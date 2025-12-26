const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");


// ===========================
// GET SLOTS BY DATE
// ===========================
router.get("/", async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date required" });
  }

  const { data, error } = await supabase
    .from("slots")
    .select("*")
    .eq("date", date)
    .order("time", { ascending: true });

  if (error) return res.status(500).json(error);

  return res.json(data);
});


// ===========================
// BLOCK / UNBLOCK SLOT
// ===========================
router.post("/block", async (req, res) => {
  try {
    const { slotId, block } = req.body;

    if (!slotId) {
      return res.status(400).json({ error: "slotId is required" });
    }

    // default = true (block)
    const shouldBlock = (block === undefined) ? true : !!block;

    // Check slot exists
    const { data: slot, error: slotErr } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slotId)
      .single();

    if (slotErr) return res.status(500).json(slotErr);
    if (!slot) return res.status(404).json({ error: "Slot not found" });

    // Update state
    const { error: updErr } = await supabase
      .from("slots")
      .update({ is_blocked: shouldBlock })
      .eq("id", slotId);

    if (updErr) return res.status(500).json(updErr);

    return res.json({
      success: true,
      slotId,
      blocked: shouldBlock,
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
