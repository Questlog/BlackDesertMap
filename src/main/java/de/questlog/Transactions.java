package de.questlog;

import de.questlog.tables.Marker;
import de.questlog.tables.User;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import javax.persistence.*;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by Benni on 20.03.2016.
 */
public class Transactions {
    private EntityManagerFactory factory;
    private static final Logger LOGGER = LogManager.getLogger(Transactions.class);


    public class TransactionException extends Exception {}
    public class DoesAlreadyExist extends TransactionException {}
    public class NotFound extends TransactionException {}

    public Transactions(EntityManagerFactory factory) {
        this.factory = factory;
        EntityManager em = factory.createEntityManager();
        //em.setFlushMode(FlushModeType.COMMIT);
    }

    public List<Marker> getMarkers(boolean isAuthenticated) {
        return getMarkers(isAuthenticated, null, null);
    }
    public List<Marker> getMarkers(boolean isAuthenticated, String type) {
        return getMarkers(isAuthenticated, type, null);
    }
    public List<Marker> getMarkers(boolean isAuthenticated, String type, Integer id) {
        EntityManager entityManager = factory.createEntityManager();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Marker> cq = cb.createQuery(Marker.class);
        Root<Marker> marker = cq.from(Marker.class);
        List<Predicate> predicates = new ArrayList<Predicate>();

        if(!isAuthenticated)
            predicates.add(cb.equal(marker.get("authRequired"), false));

        if(type != null)
            predicates.add(cb.like(marker.get("type"), type));

        if(id != null)
            predicates.add(cb.equal(marker.get("id"), id));

        cq.select(marker).where(predicates.toArray(new Predicate[]{}));
        return entityManager.createQuery(cq).getResultList();

        /*//the old fashioned way
        TypedQuery<Marker> nq;
        if(isAuthenticated)
            nq = entityManager.createNamedQuery("getAllMarkers", Marker.class);
        else
            nq = entityManager.createNamedQuery("getPublicMarkers", Marker.class);

        return nq.getResultList();
        */
    }

    public User addNewUser(User u) throws DoesAlreadyExist {
        EntityManager em = factory.createEntityManager();
        em.getTransaction().begin();

        TypedQuery<User> nq = em.createNamedQuery("findUserByName", User.class);
        nq.setParameter("username", u.getUsername());

        if(nq.getResultList().size() > 0)
            throw new DoesAlreadyExist();

        em.persist(u);

        em.getTransaction().commit();

        return u;
    }

    public User findUserByTs3ID(String ts3id){
        EntityManager em = factory.createEntityManager();

        TypedQuery<User> nq = em.createNamedQuery("findUserByTs3ID", User.class);
        nq.setParameter("ts3id", ts3id);

        try {
            return nq.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    public User updateUser(User u) throws NotFound, DoesAlreadyExist {
        EntityManager em = factory.createEntityManager();
        em.getTransaction().begin();

        TypedQuery<User> nq = em.createNamedQuery("findUserByName", User.class);
        nq.setParameter("username", u.getUsername());

        if(nq.getResultList().size() > 0)
            throw new DoesAlreadyExist();

         nq = em.createNamedQuery("findUserByTs3ID", User.class);
        nq.setParameter("ts3id", u.getTs3id());
        List<User> resultList = nq.getResultList();

        if(resultList.size() <= 0)
            throw new NotFound();
        User f = resultList.get(0);
        u.setId(f.getId());

        em.merge(u);

        em.getTransaction().commit();
        return u;
    }

    public User findUser(String nickname, String passwordhash) {
        if(nickname == null || passwordhash == null)
            return null;

        EntityManager em = factory.createEntityManager();

        TypedQuery<User> nq = em.createNamedQuery("checkPassword", User.class);
        nq.setParameter("username", nickname);
        nq.setParameter("password_hash", passwordhash);

        try {
            return nq.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    public Marker addNewMarker(Marker m) throws DoesAlreadyExist {
        EntityManager em = factory.createEntityManager();
        em.getTransaction().begin();
        LOGGER.info("new marker");

        em.persist(m);

        em.getTransaction().commit();

        return m;
    }

    public void updateMarker(Marker m)  {
        EntityManager em = factory.createEntityManager();
        em.getTransaction().begin();

        em.merge(m);

        em.getTransaction().commit();
    }

    public void deleteMarker(Marker m)  {
        EntityManager em = factory.createEntityManager();
        em.getTransaction().begin();

        Marker toRemove = em.merge(m);
        em.remove(toRemove);

        em.getTransaction().commit();
    }
}
