
const errorHandler = (err, req, res, next) => {
    if (err.isJoi) {
      // VALIDATION ERRORS  
      return res.status(400).json({ message: err.details[0].message }); 
    }
    
    console.error(err); 
    
    return res.status(500).json({ message: "Internal Server Error" });
  };
  
  export default errorHandler;