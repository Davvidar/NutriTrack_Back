function calcularObjetivosNutricionales({ peso, altura, edad, sexo, actividad, objetivo }) {
    let tmb;
  
    if (sexo === "masculino") {
      tmb = 10 * peso + 6.25 * altura - 5 * edad + 5;
    } else {
      tmb = 10 * peso + 6.25 * altura - 5 * edad - 161;
    }
  
    const factores = {
      sedentario: 1.2,
      ligero: 1.375,
      moderado: 1.55,
      activo: 1.725,
      "muy activo": 1.9
    };
  
    let get = tmb * factores[actividad];
  
    if (objetivo === "perder peso") get -= 500;
    if (objetivo === "ganar músculo") get += 300;
  
    const calorias = Math.round(get);
    const proteinas = Math.round((0.25 * calorias) / 4);
    const carbohidratos = Math.round((0.50 * calorias) / 4);
    const grasas = Math.round((0.25 * calorias) / 9);
  
    return { calorias, proteinas, carbohidratos, grasas };
  }  
  module.exports = { calcularObjetivosNutricionales };
  
