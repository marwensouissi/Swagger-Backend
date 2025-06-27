export async function checkIfSwaggerExists() {
  try {
    const res = await fetch("http://localhost:6060/swagger/list-json");

    if (!res.ok) {
      console.error(" Failed to fetch Swagger files");
      return false;
    }

    const data = await res.json(); // data = { files: [...] }
    const exists = Array.isArray(data.files) && data.files.length > 0;

    console.log("Swagger exists:", exists);
    return exists;
  } catch (err) {
    console.error(" Error checking Swagger existence:", err);
    return false;
  }
}

  
  
  export async function uploadSwaggerJson(file) {
    const formData = new FormData();
    formData.append("file", file);
  
    const res = await fetch("http://localhost:6060/swagger/upload-json", {
      method: "POST",
      body: formData,
    });
  
    if (!res.ok) throw new Error("Failed to upload swagger.json");
  }
  