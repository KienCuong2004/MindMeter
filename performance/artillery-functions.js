module.exports = {
  generateRandomEmail,
  generateRandomPage,
};

function generateRandomEmail(context, events, done) {
  context.vars.email = `test${Math.floor(Math.random() * 10000)}@example.com`;
  return done();
}

function generateRandomPage(context, events, done) {
  context.vars.page = Math.floor(Math.random() * 10);
  return done();
}
