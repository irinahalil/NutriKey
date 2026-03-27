const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const calorieForm = document.getElementById("calorie-form");
const calorieResult = document.getElementById("calorie-result");

if (calorieForm && calorieResult) {
  calorieForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const gender = document.getElementById("gender").value;
    const age = Number(document.getElementById("age").value);
    const weight = Number(document.getElementById("weight").value);
    const height = Number(document.getElementById("height").value);
    const activity = Number(document.getElementById("activity").value);
    const goal = document.getElementById("goal").value;

    if (!age || !weight || !height || !activity) {
      calorieResult.innerHTML = `
        <div class="result-box">
          <p>Пожалуйста, заполните все поля.</p>
        </div>
      `;
      return;
    }

    let bmr = 0;

    // Формула Миффлина — Сан Жеора
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const maintenanceCalories = bmr * activity;

    let targetCalories = maintenanceCalories;
    let goalText = "Поддержание";
    let goalComment = "Это ориентир для сохранения текущей формы.";

    if (goal === "lose") {
      targetCalories = maintenanceCalories * 0.9;
      goalText = "Похудение";
      goalComment =
        "Для снижения веса заложен мягкий дефицит 10% без более жёсткого урезания калорий.";
    }

    if (goal === "gain") {
      targetCalories = maintenanceCalories * 1.1;
      goalText = "Набор";
      goalComment =
        "Для набора заложен умеренный профицит, который можно корректировать по динамике.";
    }

    // БЖУ
    const proteinGrams = weight * 1.8;
    const fatGrams = weight * 0.9;

    const proteinCalories = proteinGrams * 4;
    const fatCalories = fatGrams * 9;
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = carbCalories > 0 ? carbCalories / 4 : 0;

    const roundedBmr = Math.round(bmr);
    const roundedMaintenance = Math.round(maintenanceCalories);
    const roundedTarget = Math.round(targetCalories);
    const roundedProtein = Math.round(proteinGrams);
    const roundedFat = Math.round(fatGrams);
    const roundedCarbs = Math.max(0, Math.round(carbGrams));

    calorieResult.innerHTML = `
      <div class="result-box">
        <h3>Ваш ориентировочный результат</h3>
        <p><strong>Базовый обмен:</strong> ${roundedBmr} ккал</p>
        <p><strong>Калорийность с учётом активности:</strong> ${roundedMaintenance} ккал</p>
        <p><strong>Цель:</strong> ${goalText}</p>
        <p><strong>Рекомендуемая калорийность:</strong> ${roundedTarget} ккал</p>
        <p><strong>Белки:</strong> ${roundedProtein} г</p>
        <p><strong>Жиры:</strong> ${roundedFat} г</p>
        <p><strong>Углеводы:</strong> ${roundedCarbs} г</p>
        <p class="result-note">${goalComment}</p>
        <p class="result-note">
          При выраженном голоде, слабости или плато расчёт лучше корректировать индивидуально.
        </p>
      </div>
    `;
  });
}
