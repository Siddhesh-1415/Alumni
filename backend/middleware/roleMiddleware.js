const authorizeRoles = (...roles)=>{

 return (req,res,next)=>{

  if(!req.user){
   return res.status(401).json({
    message:"User not authenticated"
   })
  }

  const userRole = String(req.user.role || "").trim().toLowerCase()
  const allowedRoles = roles.map((role) => String(role).trim().toLowerCase())

  if (!allowedRoles.includes(userRole)) {
   console.warn(`Role check failed in authorizeRoles: userRole='${req.user.role}' allowed=[${roles.join(', ')}]`) // helpful debug in backend
   return res.status(403).json({
    message: `Access denied: role '${req.user.role || "unknown"}' not allowed. Allowed roles: ${roles.join(', ')}`
   })
  }

  next()

 }

}

export default authorizeRoles