const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

/**
 * BOOK SLOT
 */
router.post("/", async (req, res) => {
  try {
    const { name, phone, slotId } = req.body;

    if (!name || !phone || !slotId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1️⃣ Check slot exists
    const { data: slot, error: slotErr } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slotId)
      .single();

    if (slotErr) return res.status(500).json(slotErr);
    if (!slot) return res.status(404).json({ error: "Slot not found" });
    if (slot.is_blocked)
      return res.status(400).json({ error: "Slot is blocked" });

    // 2️⃣ Check if already booked
    const { data: existing, error: existErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("slot_id", slotId)
      .neq("status", "cancelled");

    if (existErr) return res.status(500).json(existErr);

    if (existing.length > 0) {
      return res.status(400).json({ error: "Slot already booked" });
    }

    // 3️⃣ Check if patient already exists (prevents duplicates)
    let { data: patient, error: patientErr } = await supabase
      .from("patients")
      .select("*")
      .eq("phone", phone)
      .single();

    if (patientErr && patientErr.code !== "PGRST116") {
      return res.status(500).json(patientErr);
    }

    // If not exists → create
    if (!patient) {
      const { data: newPatient, error: newPatientErr } = await supabase
        .from("patients")
        .insert([{ name, phone }])
        .select()
        .single();

      if (newPatientErr) return res.status(500).json(newPatientErr);

      patient = newPatient;
    }

    // 4️⃣ Create booking
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .insert([
        {
          patient_id: patient.id,
          slot_id: slotId,
          status: "pending"
        }
      ])
      .select()
      .single();

    if (bookingErr) return res.status(500).json(bookingErr);

    return res.json({
      message: "Booking created successfully",
      booking
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * CANCEL BOOKING
 */
router.post("/cancel", async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId)
      return res.status(400).json({ error: "Booking ID required" });

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) return res.status(500).json(error);

    return res.json({ success: true });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * COMPLETE BOOKING
 */
router.post("/complete", async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId)
      return res.status(400).json({ error: "Booking ID required" });

    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);

    if (error) return res.status(500).json(error);

    return res.json({ success: true });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
