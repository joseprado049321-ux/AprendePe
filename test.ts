async function run() {
  const res = await fetch('http://127.0.0.1:3000/api/save-diagnostic', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({userId:"test1234", level:"Primaria", score:5})
  });
  console.log(await res.text());
}
run();
