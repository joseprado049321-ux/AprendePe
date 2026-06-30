import fs from 'fs';
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const firebaseConfigPath = "firebase-applet-config.json";
let databaseId = "(default)";
if (fs.existsSync(firebaseConfigPath)) {
  const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
  if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
}

if (getApps().length === 0) {
  initializeApp({ projectId: 'temporal-carver-3dckx' });
}
const db = getFirestore(databaseId);

async function run() {
  try {
    await db.collection("users").doc("test1234").set({
      diagnosticLevel: "Primaria",
      diagnosticScore: 5,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log("SUCCESS");
  } catch(e) {
    console.error("ERROR", e);
  }
}
run();
