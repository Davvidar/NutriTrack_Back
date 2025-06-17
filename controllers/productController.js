const Product = require("../models/Producto");
const User = require("../models/User");
const DailyLog = require("../models/DailyLog");

// Crear un nuevo producto
const createProduct = async (req, res) => {
  try {
    const { 
      nombre, 
      marca, 
      codigoBarras,
      calorias, 
      proteinas, 
      carbohidratos, 
      grasas, 
      azucares,
      grasasSaturadas,
      fibra,
      sal,
      porcion
    } = req.body;

    const userId = req.user.userId;

    const newProduct = new Product({
      nombre,
      marca,
      codigoBarras,
      calorias,
      proteinas,
      carbohidratos,
      grasas,
      azucares: azucares || undefined,
      grasasSaturadas: grasasSaturadas || undefined,
      fibra: fibra || undefined,
      sal: sal || undefined,
      porcion: porcion || undefined,
      userId
    });

    await newProduct.save();
    res.status(201).json({ message: "Producto creado", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Error creando producto", error });
  }
};

// Obtener todos los productos (globales + propios)
const getProducts = async (req, res) => {
  try {
    // Solo productos globales, no productos de usuarios específicos
    const products = await Product.find({ userId: null });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo productos", error });
  }
};

// Buscar producto por ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    if (product.userId && product.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "No tienes permiso para ver este producto" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo producto", error });
  }
};

// Actualizar producto
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    const isAdmin = req.user.rol === "admin";
    const isOwner = product.userId && product.userId.toString() === req.user.userId;

    // Producto general (solo admin puede modificar)
    if (!product.userId && !isAdmin) {
      return res.status(403).json({ message: "No puedes modificar productos generales" });
    }

    // Producto de otro usuario: denegado
    if (product.userId && !isOwner && !isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para modificar este producto" });
    }

    const {
      nombre,
      marca,
      calorias,
      proteinas,
      carbohidratos,
      grasas,
      azucares,
      grasasSaturadas,
      fibra,
      sal,
      porcion,
      codigoBarras,
      userId 
    } = req.body;

    // Permitir conversión a producto general solo si es admin
    if (userId === null && !isAdmin) {
      return res.status(403).json({ message: "Solo los administradores pueden crear productos generales" });
    }

    if (nombre) product.nombre = nombre;
    if (marca) product.marca = marca;
    if (calorias !== undefined) product.calorias = calorias;
    if (proteinas !== undefined) product.proteinas = proteinas;
    if (carbohidratos !== undefined) product.carbohidratos = carbohidratos;
    if (grasas !== undefined) product.grasas = grasas;
    if (azucares !== undefined) product.azucares = azucares;
    if (grasasSaturadas !== undefined) product.grasasSaturadas = grasasSaturadas;
    if (fibra !== undefined) product.fibra = fibra;
    if (sal !== undefined) product.sal = sal;
    if (porcion !== undefined) product.porcion = porcion;
    if (codigoBarras !== undefined) product.codigoBarras = codigoBarras;

  
    if (isAdmin && userId === null) product.userId = null;

    await product.save();
    res.json({ message: "Producto actualizado", product });
  } catch (error) {
    res.status(500).json({ message: "Error actualizando producto", error });
  }
};



// Eliminar producto
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    const isAdmin = req.user.rol === "admin";
    const isOwner = product.userId && product.userId.toString() === req.user.userId;

    // Producto general(solo admin puede eliminar)
    if (!product.userId && !isAdmin) {
      return res.status(403).json({ message: "No puedes eliminar productos generales" });
    }

    if (product.userId && !isOwner && !isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
    }

    await product.deleteOne();
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando producto", error });
  }
};


// Buscar producto por código de barras
const getProductByBarcode = async (req, res) => {
  try {
    const { codigoBarras } = req.params;
    const userId = req.user.userId;

    const product = await Product.findOne({
      codigoBarras,
      $or: [{ userId: null }, { userId }]
    });

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado por código de barras" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error buscando producto por código de barras", error });
  }
};

// Búsqueda filtros
const searchProducts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { query = "", mis, favoritos } = req.query;

    console.log('Parámetros de búsqueda recibidos:', { query, mis, favoritos, userId });

    const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // sin tildes
    const regex = new RegExp(normalized, "i");

    // CORREGIDO: Lógica de filtros
    let baseFilter;
    
    if (favoritos === "true") {
      // Para favoritos: permitir productos globales + propios del usuario
      baseFilter = { $or: [{ userId: null }, { userId }] };
    } else if (mis === "true") {
      // Solo productos del usuario actual
      baseFilter = { userId };
    } else {
      // Solo productos globales (sin propietario)
      baseFilter = { userId: null };
    }

    console.log('Filtro base aplicado:', JSON.stringify(baseFilter));

    const nameOrBrandFilter = {
      $or: [
        { nombre: { $regex: regex } },
        { marca: { $regex: regex } }
      ]
    };

    let products = await Product.find({
      ...baseFilter,
      ...nameOrBrandFilter
    });

    console.log(`Encontrados ${products.length} productos con el filtro aplicado`);

    if (favoritos === "true") {
      const user = await User.findById(userId);
      if (user && user.favoritos && user.favoritos.length > 0) {
        // Crear un conjunto de IDs de productos favoritos
        // Filtrando solo los favoritos de tipo 'product'
        const favoritosSet = new Set(
          user.favoritos
            .filter(fav => fav.tipo === 'product')
            .map(fav => fav.refId.toString())
        );
        
        // Filtrar productos que están en el conjunto de favoritos
        products = products.filter(p => favoritosSet.has(p._id.toString()));
        console.log(`Filtrado por favoritos: ${products.length} productos`);
      } else {
        console.log('No hay favoritos definidos para el usuario');
        products = []; // Si no hay favoritos, devolvemos array vacío
      }
    }

    res.json(products);
  } catch (error) {
    console.error('Error en searchProducts:', error);
    res.status(500).json({ message: "Error en la búsqueda", error });
  }
};

const getProductosRecientes = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Obtener los últimos registros diarios
    const logs = await DailyLog.find({ userId }).sort({ fecha: -1 }).limit(30); // ajustable

    const usados = new Map();

    logs.forEach(log => {
      const comidas = log.comidas;
      for (const key in comidas) {
        comidas[key].forEach(item => {
          if (!usados.has(item.productId.toString())) {
            usados.set(item.productId.toString(), item.productId);
          }
        });
      }
    });

    // 2. Obtener los productos recientes
    const recientesIds = Array.from(usados.values()).slice(0, 20);
    const recientes = await Product.find({ _id: { $in: recientesIds } });

    // 3. Obtener todos los demás productos del usuario o globales, excluyendo los recientes
    const restantes = await Product.find({
      _id: { $nin: recientesIds },
      $or: [{ userId: null }, { userId }]
    });

    res.json({ recientes, restantes });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos recientes", error });
  }
};
const cargarProductosMasivos = async (req, res) => {
  try {
    const userId = req.user.userId;
    const productos = req.body;

    if (!Array.isArray(productos)) {
      return res.status(400).json({ message: "Se requiere un array de productos" });
    }

    const nuevos = productos.map(p => ({
      nombre: p.nombre,
      marca: p.marca || "",
      codigoBarras: p.codigoBarras || null,
      calorias: p.calorias,
      proteinas: p.proteinas,
      carbohidratos: p.carbohidratos,
      grasas: p.grasas,
      azucares: p.azucares || null,
      grasasSaturadas: p.grasasSaturadas || null,
      fibra: p.fibra || null,
      sal: p.sal || null,
      porcion: p.porcion || null,
      userId 
    }));

    const insertados = await Product.insertMany(nuevos);

    res.status(201).json({ message: `${insertados.length} productos añadidos`, productos: insertados });
  } catch (error) {
    res.status(500).json({ message: "Error al cargar productos masivos", error });
  }
};

module.exports = { 
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
  searchProducts,
  getProductosRecientes,
  cargarProductosMasivos
};
