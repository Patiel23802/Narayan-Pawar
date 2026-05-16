import { Complaint } from '../models/index.js';

function randomDigits(len = 5) {
  let s = '';
  for (let i = 0; i < len; i += 1) {
    s += Math.floor(Math.random() * 10).toString();
  }
  return s;
}

export async function generateComplaintNo() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const no = `NS-${randomDigits(5)}`;
    const existing = await Complaint.findOne({ where: { complaint_no: no } });
    if (!existing) return no;
  }
  return `NS-${Date.now().toString().slice(-5)}`;
}
