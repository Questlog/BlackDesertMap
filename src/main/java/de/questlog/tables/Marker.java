package de.questlog.tables;

public class Marker {
    private int id;
    private String type = "default";
    private Boolean authRequired;
    private Object geojson;
    private Object params;

//    @Transient
//    private Map<String, String> params;


    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }
    public void setType(String type) {
        this.type = type;
    }

    public Boolean getAuthRequired() {
        return authRequired;
    }
    public void setAuthRequired(Boolean authRequired) {
        this.authRequired = authRequired;
    }

    public Object getGeojson() {
        return geojson;
    }
    public void setGeojson(Object geojson) {
        this.geojson = geojson;
    }

    public Object getJsonParams() {
        return params;
    }
    public void setJsonParams(Object JsonParams) {
        this.params = params;
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Marker marker = (Marker) o;

        if (id != marker.id) return false;
        if (type != null ? !type.equals(marker.type) : marker.type != null) return false;
        if (authRequired != null ? !authRequired.equals(marker.authRequired) : marker.authRequired != null)
            return false;
        if (geojson != null ? !geojson.equals(marker.geojson) : marker.geojson != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = id;
        result = 31 * result + (type != null ? type.hashCode() : 0);
        result = 31 * result + (authRequired != null ? authRequired.hashCode() : 0);
        result = 31 * result + (geojson != null ? geojson.hashCode() : 0);
        return result;
    }

}
