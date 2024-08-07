import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown, Input } from "../components/layout";
import PageNav from "../components/PageNav";
import { supabase } from "../supabase";
import { useForm } from "react-hook-form";
import { Modal, Button } from 'react-bootstrap';
import './AppLayout.module.css';

const AppLayout = () => {
  const [values, setValues] = useState({
    nextSalesId: null,
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    product_name: "",
    sku: "",
    family: "",
    sub_family: "",
    subject_to_shelf_life: "",
    quantity: "",
    order_quantity: "",
    bal_due: "",
  });
  const [suggestions, setSuggestions] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { register, reset, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    const getNextSalesId = async () => {
      const { data, error } = await supabase.from("SalesOrder").select("sales_id");
      if (error) console.log("Error loading sales", error);
      else {
        const lastId = data.length ? Math.max(...data.map((order) => order.sales_id)) : 0;
        setValues((prevValues) => ({
          ...prevValues,
          nextSalesId: lastId + 1
        }));
      }
    };

    const fetchProducts = async () => {
      const fetchResult = await supabase.from("Product").select("*");

      if (fetchResult.error) {
        console.log("Error fetching products:", fetchResult.error.message);
      } else {
        setProducts(fetchResult.data);
      }
    };

    getNextSalesId();
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({ ...currentProduct, [name]: value });

    if (name === "product_name") {
      const matchingProducts = products.filter((p) => p.name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(matchingProducts);

      const product = products.find((p) => p.name === value);
      if (product) {
        setCurrentProduct({
          ...currentProduct,
          product_name: value,
          sku: product.sku,
          family: product.family,
          sub_family: product.sub_family,
          subject_to_shelf_life: product.subject_to_shelf_life,
          quantity: product.quantity,
          order_quantity: currentProduct.order_quantity,
          bal_due: product.quantity - currentProduct.order_quantity,
        });
      } else {
        setCurrentProduct({
          ...currentProduct,
          product_name: value,
          sku: "",
          family: "",
          sub_family: "",
          subject_to_shelf_life: "",
          quantity: "",
          order_quantity: "",
          bal_due: "",
        });
      }
    }

    if (name === "order_quantity") {
      const product = products.find((p) => p.name === currentProduct.product_name);
      if (product) {
        const balanceDue = product.quantity - value;
        setCurrentProduct({ ...currentProduct, bal_due: balanceDue, order_quantity: value });
      }
    }
  };

  const handleSuggestionClick = (product) => {
    setCurrentProduct({
      ...currentProduct,
      product_name: product.name,
      sku: product.sku,
      family: product.family,
      sub_family: product.sub_family,
      subject_to_shelf_life: product.subject_to_shelf_life,
      quantity: product.quantity,
      order_quantity: currentProduct.order_quantity,
      bal_due: product.quantity - currentProduct.order_quantity,
    });
    setSuggestions([]);
  };

  const handleAddProduct = () => {
    const product = products.find((p) => p.name === currentProduct.product_name);
    if (product) {
      const updatedProduct = {
        ...product,
        order_quantity: currentProduct.order_quantity,
        bal_due: currentProduct.bal_due,
      };
      const newSelectedProducts = [...selectedProducts, updatedProduct];
      console.log('Adding product to selectedProducts:', newSelectedProducts); // Debug message
      setSelectedProducts(newSelectedProducts);
      setCurrentProduct({
        id: null,
        product_name: "",
        sku: "",
        family: "",
        sub_family: "",
        subject_to_shelf_life: "",
        quantity: "",
        order_quantity: "",
        bal_due: "",
      });
    } else {
      console.log("Product not found");
    }
  };

  const handleEditProduct = (index) => {
    setEditIndex(index);
    const productToEdit = selectedProducts[index];
    setCurrentProduct({
      id: productToEdit.id,
      product_name: productToEdit.name,
      sku: productToEdit.sku,
      family: productToEdit.family,
      sub_family: productToEdit.sub_family,
      subject_to_shelf_life: productToEdit.subject_to_shelf_life,
      quantity: productToEdit.quantity,
      order_quantity: productToEdit.order_quantity || '',
      bal_due: productToEdit.bal_due || '',
    });
    setShowModal(true);
  };

  const handleDeleteProduct = (index) => {
    const updatedProducts = selectedProducts.filter((_, i) => i !== index);
    console.log('Deleting product from selectedProducts:', updatedProducts); // Debug message
    setSelectedProducts(updatedProducts);
  };

  const handleModalSave = () => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[editIndex] = {
      ...currentProduct,
      name: currentProduct.product_name, // Ensure name is updated
    };
    console.log('Updating product in selectedProducts:', updatedProducts); // Debug message
    setSelectedProducts(updatedProducts);
    setShowModal(false);
    setCurrentProduct({
      id: null,
      product_name: "",
      sku: "",
      family: "",
      sub_family: "",
      subject_to_shelf_life: "",
      quantity: "",
      order_quantity: "",
      bal_due: "",
    });
    setEditIndex(null);
  };

  const handleSave = async (data) => {
    const sanitizedData = {
      ...data,
      order_date: data.order_date ? new Date(data.order_date).toISOString() : new Date().toISOString(),
      ship_date_1: data.ship_date_1 ? new Date(data.ship_date_1).toISOString() : null,
      ship_date_2: data.ship_date_2 ? new Date(data.ship_date_2).toISOString() : null,
      date_of_ship: data.date_of_ship ? new Date(data.date_of_ship).toISOString() : null,
      date_of_arrival: data.date_of_arrival ? new Date(data.date_of_arrival).toISOString() : null,
      total_cost: data.total_cost || 0,
      status: data.status || "Pending",
      currency: "CAD",
    };
    try {
      setSubmitLoading(true);
      const { error } = await supabase
        .from("SalesOrder")
        .insert([sanitizedData])
        .select();
      if (error) throw error;
      // const salesOrderId = salesOrderData[0].sales_id;
      // const productsToSave = selectedProducts.map((product) => ({
      //   sales_order_id: salesOrderId,
      //   ...product,
      // }));
      // const { error: productError } = await supabase
      //   .from("SalesOrderItems")
      //   .insert(productsToSave);
      // if (productError) throw productError;
      alert("Sales order and products saved successfully");
      reset();
      setSubmitLoading(false);
      navigate("/sales");
    } catch (error) {
      alert("An unexpected error has occurred!");
      console.log("Error creating record in Supabase", error);
      setSubmitLoading(false);
    }
  };


  return (
    <div>
      <PageNav />
      <div className="d-flex justify-content-center align-items-center mb-4">
        <div className="container" style={{ maxWidth: "1200px" }}>
          <form className="mt-5 fs-4" onSubmit={handleSubmit(handleSave)}>
            <h2 style={{ fontWeight: "bold" }}>Sales order</h2>
            <Input label="Id" disabled value={values.nextSalesId || ""} />
            <Input
              register={register}
              label="Client name"
              name="client"
              defaultValue=""
            />
            <hr className="hr my-4" />
            <h2 style={{ fontWeight: "bold" }}>Product</h2>
            <div className="form-group">
              <label className="product-label">Product name</label>
              <input
                className="product-input"
                type="text"
                name="product_name"
                value={currentProduct.product_name}
                onChange={handleInputChange}
              />
              {suggestions.length > 0 && (
                <ul>
                  {suggestions.map((product, index) => (
                    <li key={index} onClick={() => handleSuggestionClick(product)}>
                       {product.name}
                    </li>

                  ))}
                </ul>
              )}
            </div>
            <Input
              label="SKU"
              name="sku"
              value={currentProduct.sku}
              disabled
            />
            <Input
              label="Family"
              name="family"
              value={currentProduct.family}
              disabled
            />
            <Input
              label="Subfamily"
              name="sub_family"
              value={currentProduct.sub_family}
              disabled
            />
            <Input
              label="Subject to Shelf Life"
              name="subject_to_shelf_life"
              value={currentProduct.subject_to_shelf_life}
              disabled
            />
            <Input
              name="order_quantity"
              label="Order quantity"
              type="number"
              value={currentProduct.order_quantity}
              onChange={handleInputChange}
            />
            <Input
              name="bal_due"
              label="Bal due"
              disabled
              value={currentProduct.bal_due}
              onChange={handleInputChange}
            />
            <button className="btn btn-primary fs-4" type="button" onClick={handleAddProduct}>
              Add product to sale
            </button>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Family</th>
                  <th>Subfamily</th>
                  <th>Subject to Shelf Life</th>
                  <th>Order Quantity</th>
                  <th>Balance Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.family}</td>
                    <td>{product.sub_family}</td>
                    <td>{product.subject_to_shelf_life}</td>
                    <td>{product.order_quantity}</td>
                    <td>{product.bal_due}</td>
                    <td>
                      <button type="button" onClick={() => handleEditProduct(index)}>Edit</button>
                      <button onClick={() => handleDeleteProduct(index)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className="hr my-4" />
            <h2 className="mt-4" style={{ fontWeight: "bold" }}>
              Shipment
            </h2>
            <Input
              register={register}
              name="order_date"
              label="Order date"
              type="date"
              defaultValue=""
            />
            <Dropdown
              label="Partial Shipment"
              name="partial_shipment"
              register={register}
              options={["", "Yes", "No"]}
            />
            <div className="row">
              <div className="col-md-6">
                <Input
                  register={register}
                  name="ship_date_1"
                  label="Ship Date 1"
                  type="date"
                  defaultValue=""
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Count days to sched date 1"
                  disabled={true}
                  defaultValue=""
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <Input
                  register={register}
                  name="ship_date_2"
                  label="Ship Date 2"
                  type="date"
                  defaultValue=""
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Count days to sched date 2"
                  disabled={true}
                  defaultValue=""
                />
              </div>
            </div>
            <Dropdown
              label="Operation Status"
              register={register}
              name="status"
              options={[
                "",
                "Work Order - Initial",
                "Purchasing",
                "Work Order - Secondary",
                "Incoming",
                "Quality",
                "Kitting",
                "Production",
                "Shipping",
              ]}
            />
            <Input
              register={register}
              name="date_of_ship"
              label="Date of shipment"
              type="date"
              defaultValue=""
            />
            <Input
              label="Lead Time (from order to shipping)"
              disabled={true}
              defaultValue=""
            />
            <Input label="Shipped on time?" disabled={true} defaultValue="" />
            <Dropdown
              label="Status of shipment"
              register={register}
              name="status_of_shipment"
              options={["", "Delayed", "On the way", "Delivered"]}
            />
            <Input
              register={register}
              name="date_of_arrival"
              label="Date of arrival"
              type="date"
              defaultValue=""
            />
            <Input
              label="Transit time (from shipment to delivery)"
              disabled={true}
              defaultValue=""
            />
            <Input label="Total time" disabled={true} defaultValue="" />
            <Input
              register={register}
              name="comments"
              label="Comments"
              defaultValue=""
            />
            <div className="d-flex gap-3 flex-row-reverse my-4">
              <button
                className="btn btn-primary fs-4 10 w-100"
                type="submit"
                style={{ maxWidth: "200px" }}
              >
                {submitLoading ? "Processing..." : "Save"}
              </button>
              <button
                className="btn btn-outline-primary fs-4 10 w-100"
                style={{ maxWidth: "200px" }}
                type="button"
                onClick={() => {
                  reset();
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label className="product-label">Product name</label>
            <input
              className="product-input"
              type="text"
              name="product_name"
              value={currentProduct.product_name}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="product-label">Order quantity</label>
            <input
              className="product-input"
              type="number"
              name="order_quantity"
              value={currentProduct.order_quantity}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="product-label">Bal due</label>
            <input
              className="product-input"
              type="text"
              name="bal_due"
              value={currentProduct.bal_due}
              disabled
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleModalSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AppLayout;
