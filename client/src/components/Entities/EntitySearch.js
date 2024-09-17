import React, { useState, useEffect, useRef } from "react";
import * as utilities from "../../utilities.js";
import { useNavigate } from "react-router-dom";
import { useData } from "../../DataContext";

function EntitySearch() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [query, setQuery] = useState("");
  const [entities, setEntities] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [searchCategories, setsearchCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const hasResults = entities.length > 0 || addresses.length > 0;
  const navigate = useNavigate();

  const performSearch = async () => {
    if (query.length < 3) {
      setEntities([]);
      setAddresses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/entities?query=${query}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setEntities(data.result.entities.slice(0, 5));
      setAddresses(data.result.addresses.slice(0, 5));
      setsearchCategories(data.result.categories.slice(0, 5));
    } catch (error) {
      console.error("Search error:", error.message);
      alert("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timerId = setTimeout(performSearch, 300);
    return () => clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setEntities([]);
        setAddresses([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/entities/categories`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setGlobalDataCache((prevData) => ({
          ...prevData,
          entityCategories: data,
        }));
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    if (!globalDataCache.entities) {
      fetchCategories();
    }
  }, []);

  const handleInputChange = (event) => {
    setQuery(event.target.value);
  };

  const handleAddressClick = (address) => {
    navigate(`/wallets/${address}`);
  };

  const handleEntityClick = (entity) => {
    navigate(`/entities/${entity.id}`, { state: { entity } });
  };

  const handleCategoryClick = (category) => {
    setGlobalDataCache((prevData) => ({
      ...prevData,
      selectedCategory: category,
    }));
    navigate(`/entities/categories/${category.id}`, { state: { category } });
  };

  return (
    <div className="container text-center" style={{ padding: "100px 0" }}>
      <div className="row">
        <h1>
          🔍 <br />
          Entity Search
        </h1>
        <div id="wallet-container">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={handleInputChange}
            style={{ width: "100%", padding: "10px" }}
          />

          <div className="search-box">
            {hasResults && (
              <div ref={searchRef}>
                <div className="search-results">
                  <h5>Entities</h5>
                  {entities.length > 0 ? (
                    entities.map((entity) => (
                      <div
                        className="search-item"
                        key={entity.id}
                        onClick={() => handleEntityClick(entity)}
                      >
                        <img src={entity.logo} width="25" />
                        {entity.name} - {entity.type}
                      </div>
                    ))
                  ) : (
                    <p>No entities found.</p>
                  )}
                  <hr></hr>
                  <h5>Addresses</h5>
                  {addresses.length > 0 ? (
                    addresses.map((address) => (
                      <div
                        className="search-item"
                        key={address.address}
                        onClick={() => handleAddressClick(address.address)}
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${address.address}`}
                          width="25"
                        />
                        {address.primary_label} (
                        {utilities.shortAddress(address.address)})
                      </div>
                    ))
                  ) : (
                    <p>No addresses found.</p>
                  )}

                  <hr></hr>
                  <h5>Categories</h5>
                  {searchCategories.length > 0 ? (
                    searchCategories.map((category) => (
                      <div
                        className="search-item"
                        key={category.id}
                        onClick={() => handleCategoryClick(category)}
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${category.id}`}
                          width="25"
                        />
                        {category.name}
                      </div>
                    ))
                  ) : (
                    <p>No entities found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="row">
        <h2 className="explore-title">Explore Categories</h2>
        <div className="categories-container">
          <div className="row">
            {globalDataCache.entityCategories &&
            globalDataCache.entityCategories.length > 0 ? (
              globalDataCache.entityCategories.map((category) => (
                <div key={category.id} className="col-lg-3">
                  <div
                    className="category-card"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div>{category.name}</div>
                    <div className="entity-count">
                      {category.total_entities}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No categories found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntitySearch;
