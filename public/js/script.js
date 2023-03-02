var valueCount;
var stockLimit;

// plus-btn
document.querySelector(".plus-btn").addEventListener("click", function () {
  valueCount = parseInt(document.getElementById("userQuantity").value);
  stockLimit = parseInt(document.getElementById("limitStock").value);

  if (valueCount < stockLimit) {
    valueCount++;
    document.getElementById("userQuantity").value = valueCount;
  }

  if (valueCount > 1) {
    document.querySelector(".minus-btn").removeAttribute("disabled");
    document.querySelector(".minus-btn").classList.remove("disabled");
  }

  if (valueCount >= stockLimit) {
    document.querySelector(".plus-btn").setAttribute("disabled", "disabled");
    document.querySelector(".plus-btn").classList.add("disabled");
  }
});

// minus-btn
document.querySelector(".minus-btn").addEventListener("click", function () {
  valueCount = parseInt(document.getElementById("userQuantity").value);
  valueCount--;
  document.getElementById("userQuantity").value = valueCount;

  if (valueCount == 1) {
    document.querySelector(".minus-btn").setAttribute("disabled", "disabled");
  }

  if (valueCount < stockLimit) {
    document.querySelector(".plus-btn").removeAttribute("disabled");
    document.querySelector(".plus-btn").classList.remove("disabled");
  }
});

function enableUpdateButton() {
  const cartQuantityInputs = document.querySelectorAll(".cartQuantityInput");
  cartQuantityInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const updateButton = document.querySelector(
        `#\\${input.id}.cartQuantity`
      );
      updateButton.removeAttribute("hidden");
    });
  });
}
