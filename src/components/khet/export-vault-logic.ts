import { collection, query, where, getDocs, Firestore } from "firebase/firestore";
import { User } from "firebase/auth";
import { decryptData, base64ToBuffer } from "@/lib/crypto";

export async function exportEncryptedVault(db: Firestore, user: User, masterKey: CryptoKey): Promise<void> {
  const targetCollections = [
    "cardioPrograms",
    "cardioSessions",
    "corePrograms",
    "hardMode75",
    "khetPrograms",
    "khetSessions",
    "khetSettings",
    "mobilityPrograms",
    "mobilitySettings",
  ];

  const exportData: Record<string, any[]> = {};

  for (const collectionName of targetCollections) {
    exportData[collectionName] = [];
    
    try {
      const q = query(
        collection(db, collectionName), 
        where("userId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const docId = doc.id;
        const rawData = doc.data();
        
        const decryptedDoc: any = { id: docId, ...rawData };

        try {
          if (rawData.isEncrypted) {
            // PATTERN A: Unified Payload Encryption
            if (rawData.encryptedPayload && rawData.iv) {
              const plainText = await decryptData(
                masterKey,
                base64ToBuffer(rawData.encryptedPayload),
                new Uint8Array(base64ToBuffer(rawData.iv))
              );
              
              const parsedPayload = JSON.parse(plainText);
              Object.assign(decryptedDoc, parsedPayload);
              
              delete decryptedDoc.encryptedPayload;
              delete decryptedDoc.iv;
            }

            // PATTERN B: Granular Field Encryption
            for (const key of Object.keys(rawData)) {
              if (key.startsWith("encrypted") && key !== "encryptedPayload") {
                const plainKey = key.replace("encrypted", "");
                const camelPlainKey = plainKey.charAt(0).toLowerCase() + plainKey.slice(1);
                const ivKey = `${camelPlainKey}Iv`;

                if (rawData[ivKey]) {
                  const plainText = await decryptData(
                    masterKey,
                    base64ToBuffer(rawData[key]),
                    new Uint8Array(base64ToBuffer(rawData[ivKey]))
                  );
                  
                  try {
                    decryptedDoc[camelPlainKey] = JSON.parse(plainText);
                  } catch {
                    decryptedDoc[camelPlainKey] = plainText;
                  }

                  delete decryptedDoc[key];
                  delete decryptedDoc[ivKey];
                }
              }
            }
            
            delete decryptedDoc.isEncrypted;
          }
          
          exportData[collectionName].push(decryptedDoc);
          
        } catch (err) {
          console.error(`[Decryption Error] Failed to decrypt doc ${docId} in ${collectionName}:`, err);
          exportData[collectionName].push({ ...decryptedDoc, _decryptionFailed: true });
        }
      }
    } catch (err) {
      console.error(`[Network/Fetch Error] Failed to fetch collection: ${collectionName}`, err);
    }
  }

  try {
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "khet-station-export.json";
    
    document.body.appendChild(anchor);
    anchor.click();
    
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[Export Error] Failed to generate and download export file", err);
  }
}
