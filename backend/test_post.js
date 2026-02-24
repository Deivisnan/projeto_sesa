async function run() {
    try {
        const loginRes = await fetch('http://localhost:3333/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'caf@sesa.gov.br', senha: 'senha123' })
        });
        const login = await loginRes.json();

        const unidRes = await fetch('http://localhost:3333/api/unidades', {
            headers: { 'Authorization': `Bearer ${login.token}` }
        });
        const unids = await unidRes.json();
        const taruma = unids.find(u => u.nome.toLowerCase().includes('taruma') || u.tipo === 'UBS');

        if (!taruma) { console.log("Unidade UBS nao encontrada."); return; }

        const medRes = await fetch('http://localhost:3333/api/medicamentos', {
            headers: { 'Authorization': `Bearer ${login.token}` }
        });
        const meds = await medRes.json();

        const res = await fetch(`http://localhost:3333/api/unidades/${taruma.id}/medicamentos-permitidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${login.token}` },
            body: JSON.stringify({ ids_medicamentos: [meds[0].id, meds[1].id] })
        });

        const text = await res.text();
        console.log("POST STATUS:", res.status);
        console.log("POST BODY:", text);
    } catch (err) {
        console.error(err);
    }
}
run();
