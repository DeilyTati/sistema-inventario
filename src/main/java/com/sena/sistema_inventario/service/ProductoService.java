package com.sena.sistema_inventario.service;

import com.sena.sistema_inventario.model.Producto;
import com.sena.sistema_inventario.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    private final ProductoRepository repository;

    public ProductoService(ProductoRepository repository) {
        this.repository = repository;
    }

    public List<Producto> listarProductos() {
        return repository.findAll();
    }

    public Optional<Producto> buscarPorId(Long id) {
        return repository.findById(id);
    }

    public Producto guardarProducto(Producto producto) {
        return repository.save(producto);
    }

    public Producto actualizarProducto(Long id, Producto productoDetalles) {
        return repository.findById(id).map(producto -> {
            producto.setCodigo(productoDetalles.getCodigo());
            producto.setNombre(productoDetalles.getNombre());
            producto.setCategoria(productoDetalles.getCategoria());
            producto.setPrecio(productoDetalles.getPrecio());
            producto.setCantidad(productoDetalles.getCantidad());
            producto.setProveedor(productoDetalles.getProveedor());
            return repository.save(producto);
        }).orElse(null);
    }

    public void eliminarProducto(Long id) {
        repository.deleteById(id);
    }
}
