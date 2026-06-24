const { getCollection } = require('./jsonDb');

async function generateWithOllama(type, ctx) {
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';

  const prompts = {
    post_consult: `
      You are a friendly hospital assistant for SmartCare. Write a WhatsApp message (max 3 sentences)
      confirming the patient's visit. Include: patient first name "${ctx.patient.name}",
      doctor name "Dr. ${ctx.doctor.name}", medicines prescribed: ${ctx.prescription?.medications?.map(m=>m.name).join(', ') || 'None'},
      next appointment date: ${ctx.nextAppointmentDate}.
      Tone: warm, professional. Language: ${ctx.patient.reminderSettings?.language || 'English'}.
    `,
    med_adherence: `
      Write a gentle medication reminder SMS (max 2 sentences) for ${ctx.patient.name}.
      They were prescribed ${ctx.prescription?.medications?.[0]?.name || 'medication'} for ${ctx.prescription?.diagnosis || 'their condition'}.
      Ask if they are taking it regularly. Include a simple reply option (YES/NO). Language: ${ctx.patient.reminderSettings?.language || 'English'}.
    `,
    lab_followup: `
      Write a friendly reminder email (max 3 sentences) for ${ctx.patient.name} to check their lab results.
      The test was ordered by Dr. ${ctx.doctor.name}. Remind them they can view it in the SmartCare patient portal. Language: ${ctx.patient.reminderSettings?.language || 'English'}.
    `,
    appt_reminder: `
      Write a short, professional SMS (max 2 sentences) reminding ${ctx.patient.name} of their upcoming follow-up appointment in 3 days. Language: ${ctx.patient.reminderSettings?.language || 'English'}.
    `
  };

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: prompts[type],
        stream: false
      })
    });

    if (response.ok) {
      const resData = await response.json();
      return (resData.response || '').trim();
    }
    console.warn('Ollama response error in reminders', response.status);
  } catch (err) {
    console.error('Ollama fetch error in reminders', err.message);
  }
  
  return getFallbackMessage(type, ctx);
}

function getFallbackMessage(type, ctx) {
  const name = ctx.patient.name.split(' ')[0];
  const lang = ctx.patient.reminderSettings?.language || 'English';
  
  if (type === 'post_consult') {
    return `Hi ${name}, thank you for visiting Dr. ${ctx.doctor.name} at SmartCare today. Please follow your prescribed treatments. Your next appointment is scheduled for ${ctx.nextAppointmentDate}.`;
  }
  if (type === 'med_adherence') {
    return `Hi ${name}, this is SmartCare checking in. Are you taking your prescribed medication regularly? Please reply YES or NO.`;
  }
  if (type === 'lab_followup') {
    return `Dear ${name}, your lab test results requested by Dr. ${ctx.doctor.name} are ready. Please log into the SmartCare Patient Portal to view them.`;
  }
  if (type === 'appt_reminder') {
    return `Hi ${name}, just a quick reminder from SmartCare about your upcoming follow-up appointment. See you soon!`;
  }
  return 'SmartCare: Important update regarding your health profile.';
}

async function scheduleReminders(appointmentId) {
  try {
    const apptsDb = getCollection('appointment');
    const usersDb = getCollection('user');
    const rxDb = getCollection('prescription');

    const appt = await apptsDb.findById(appointmentId);
    if (!appt) return;

    const patient = await usersDb.findById(appt.patientId) || { name: appt.patientName, reminderSettings: {} };
    const doctor = { name: appt.doctorName };
    
    // Find latest prescription for this appt
    const allRx = await rxDb.find({ appointmentId: appt._id.toString() });
    const prescription = allRx[allRx.length - 1];

    const ctx = {
      patient,
      doctor,
      prescription,
      nextAppointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };

    // Fast-forwarded delays for demonstration (seconds instead of days)
    const jobs = [
      { type: 'post_consult',    delayMs: 10 * 1000, requiresSetting: null },
      { type: 'med_adherence',   delayMs: 20 * 1000, requiresSetting: 'medication' },
      { type: 'lab_followup',    delayMs: 30 * 1000, requiresSetting: 'labTest' },
      { type: 'appt_reminder',   delayMs: 40 * 1000, requiresSetting: 'appointment' },
    ];

    const remindersDb = getCollection('reminder_schedule');

    for (const job of jobs) {
      // Check user preferences
      const settings = patient.reminderSettings || {};
      if (job.requiresSetting && settings[job.requiresSetting] === false) {
        continue; // User opted out of this type
      }

      const dnd = settings.dnd; // Mock DND logic could go here

      await remindersDb.create({
        appointmentId,
        type: job.type,
        context: ctx,
        scheduledAt: new Date(Date.now() + job.delayMs).toISOString(),
        status: 'pending',
        channel: settings.channel || 'WhatsApp',
        createdAt: new Date().toISOString()
      });
    }

    // Trigger processing (usually handled by a cron or BullMQ worker)
    setTimeout(processPendingReminders, 5000); // Check shortly
  } catch (err) {
    console.error('Error scheduling reminders:', err);
  }
}

async function processPendingReminders() {
  const remindersDb = getCollection('reminder_schedule');
  const logsDb = getCollection('log');
  const pending = await remindersDb.find({ status: 'pending' });

  let processedCount = 0;
  for (const job of pending) {
    if (new Date(job.scheduledAt) <= new Date()) {
      try {
        const message = await generateWithOllama(job.type, job.context);
        
        let deliveryDetails = JSON.stringify({
          sender: 'ai',
          text: message
        });

        // Log it as an audit log so patient can see it in "My Activity Log"
        await logsDb.create({
          userId: job.context.patient._id,
          action: 'SYSTEM_REMINDER_SENT',
          details: deliveryDetails,
          timestamp: new Date().toISOString()
        });

        // Mark sent
        await remindersDb.findByIdAndUpdate(job._id, { status: 'sent', sentAt: new Date().toISOString(), messageSent: message });
        processedCount++;
      } catch (err) {
        console.error('Error sending reminder', err);
        await remindersDb.findByIdAndUpdate(job._id, { status: 'failed', error: err.message });
      }
    }
  }
  
  if (processedCount > 0 || pending.length > processedCount) {
    // Re-check later if there's still pending
    setTimeout(processPendingReminders, 10000);
  }
}

module.exports = {
  scheduleReminders,
  processPendingReminders
};
