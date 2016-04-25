package de.questlog.tables;

import javax.persistence.*;
import java.util.List;
import java.util.Map;

/**
 * Created by Benni on 20.03.2016.
 */
@Entity
@Table(name = "MARKERS")
@Inheritance(strategy=InheritanceType.SINGLE_TABLE)
public class Marker {
    private int id;
    private String type = "default";
    private Boolean authRequired;
    private String geojson;
    private String jsonParams;

//    @Transient
//    private Map<String, String> params;

    @Id
    @Column(name = "M_ID")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }

    @Basic
    @Column(name = "TYPE")
    public String getType() {
        return type;
    }
    public void setType(String type) {
        this.type = type;
    }

    @Basic
    @Column(name = "AUTH_REQUIRED")
    public Boolean getAuthRequired() {
        return authRequired;
    }
    public void setAuthRequired(Boolean authRequired) {
        this.authRequired = authRequired;
    }

    @Basic
    @Column(name = "GEOJSON")
    public String getGeojson() {
        return geojson;
    }
    public void setGeojson(String geojson) {
        this.geojson = geojson;
    }

    @Basic
    @Column(name = "PARAMS")
    public String getJsonParams() {
        return jsonParams;
    }
    public void setJsonParams(String JsonParams) {
        this.jsonParams = JsonParams;
    }


//    public void setParams(Map<String, String> params) {
//        this.params = params;
//    }
//    public Map<String, String> getParams() {
//        return params;
//    }

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
