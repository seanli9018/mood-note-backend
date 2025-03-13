module.exports = (fn) => {
  return (req, res, next) => {
    // if error happens, we pass err to next.
    // error object being passed to next is created by mongoose which already contains error.statusCode and original error.message.
    // we are able to customize/overwrite some mongoose error message as needed.
    fn(req, res, next).catch(next);
  };
};
