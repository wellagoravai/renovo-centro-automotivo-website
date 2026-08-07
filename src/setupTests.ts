import '@testing-library/jest-dom';

// jsdom não implementa scrollIntoView (usado pelo ChatWidget para rolar até
// a última mensagem) — sem isso, qualquer teste que dispare essa rota quebra
// com "scrollIntoView is not a function".
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
}
