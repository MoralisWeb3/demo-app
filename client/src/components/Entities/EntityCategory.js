import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Nav, NavItem, NavLink, TabContent, TabPane, Table } from "reactstrap";
import CopyToClipboard from "../Misc/CopyToClipboard";
import { useNavigate } from "react-router-dom";
import { useData } from "../../DataContext";
function EntityCategory() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const { id } = useParams();
  const [categoryEntities, setCategoryEntities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const goBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    async function fetchCategoryEntites() {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/entities/categories/${id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch category details");
        }
        const data = await response.json();
        setCategoryEntities(data);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching entity details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryEntites();
  }, [id]);

  const handleEntityClick = (entity) => {
    navigate(`/entities/${entity.id}`, { state: { entity } });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!categoryEntities) return <div>No entities for category found.</div>;

  return (
    <div className="container page">
      <button
        className="btn btn-sm btn-outline portfolio-back"
        onClick={goBack}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          fill="#edf2f4"
        >
          <path
            d="M 10 4.9296875 L 2.9296875 12 L 10 19.070312 L 11.5 17.570312 L 6.9296875 13 L 21 13 L 21 11 L 6.9296875 11 L 11.5 6.4296875 L 10 4.9296875 z"
            fill="#edf2f4"
          />
        </svg>{" "}
        Back
      </button>
      <div className="entity-header">
        <div>
          <h1>
            {globalDataCache.selectedCategory.name}{" "}
            <span className="entity-type">
              {globalDataCache.selectedCategory.total_entities} entities
            </span>
          </h1>
        </div>
      </div>

      <div className="row">
        <h2 className="explore-title">Entities</h2>
        <div className="categories-container">
          <div className="row">
            {categoryEntities && categoryEntities.length > 0 ? (
              categoryEntities.map((entity) => (
                <div key={entity.id} className="col-lg-3">
                  <div
                    className="category-card entity-card"
                    onClick={() => handleEntityClick(entity)}
                  >
                    <img
                      src={
                        entity.logo
                          ? entity.logo
                          : `https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${entity.id}`
                      }
                    />
                    <div>
                      <div>{entity.name}</div>
                      <div className="entity-count">
                        {entity.total_addresses} addresses
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No entities found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntityCategory;
