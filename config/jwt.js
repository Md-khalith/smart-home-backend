module.exports = {
  secret: process.env.JWT_SECRET || 'bb55c24a74223fa29aa0e3fb2e19de6df283fe26857e8631c00fb11d1e8dd7ab707ad38fb02a07d73ad46abbabfbfedf3181427a59b84d0f1bd6aa2d3e65e408  ',
  expiresIn: process.env.JWT_EXPIRE || '7d'
};