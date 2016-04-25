package de.questlog.tables;

import javax.persistence.*;

/**
 * Created by Benni on 30.03.2016.
 */
@Entity
@Table(name = "USERS")
@NamedQueries({
        @NamedQuery(name="findUserByTs3ID", query = "select u from User u where u.ts3id = :ts3id"),
        @NamedQuery(name="findUserByName", query = "select u from User u where u.username = :username"),
        @NamedQuery(name="checkPassword", query = "select u from User u where u.username = :username and u.password = :password_hash")
})
public class User {
    private int id;
    private String username;
    private String password;
    private String ts3id;

    @Id
    @Column(name = "USER_ID")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }

    @Basic
    @Column(name = "USERNAME")
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    @Basic
    @Column(name = "PASSWORD")
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    @Basic
    @Column(name = "TS3ID", unique = true)
    public String getTs3id() {
        return ts3id;
    }
    public void setTs3id(String ts3id) {
        this.ts3id = ts3id;
    }
}
