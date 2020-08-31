const express = require("express");
const bodyParser = require("body-parser");
const Favorite = require("../models/favorite");
const authenticate = require("../authenticate");
const cors = require("./cors");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find()
      .populate("favorites.user")
      .populate("favorites.campsites")
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (!favorite) {
          Favorite.create({ user: req.user._id, campsites: req.body })
            .then((favorites) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorites);
            })
            .catch((err) => next(err));
        } else {
          req.body.forEach((campsite) => {
            if (favorite.campsites.indexOf(campsite._id) == -1) {
              favorite.campsites.push(campsite._id);
            }
          });
          favorite
            .save()
            .then((favorites) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorites);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorites");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          favorite.remove();
          favorite
            .save()
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        } else {
          err = new Error(`There is no favorites list for your user!`);
          err.status = 403;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res) => {
    res.end(
      `GET operation not supported on /favorites/${req.params.campsiteId}`
    );
  })

  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (!favorite) {
          Favorite.create({
            user: req.user._id,
            campsites: [{ _id: req.params.campsiteId }],
          })
            .then((favorites) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorites);
            })
            .catch((err) => next(err));
        } else {
          if (favorite.campsites.indexOf(req.params.campsiteId) == -1) {
            favorite.campsites.push(req.params.campsiteId);
            favorite
              .save()
              .then((favorites) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorites);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(
              `Campsite ${req.params.campsiteId} is already in the list of favorites!`
            );
            err.status = 404;
            return next(err);
          }
        }
      })
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /favorites/${req.params.campsiteId}`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          if (favorite.campsites.indexOf(req.params.campsiteId) != -1) {
            favorite.campsites.pull(req.params.campsiteId);
            favorite
              .save()
              .then((favorites) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorites);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(
              `Campsite ${req.params.campsiteId} is not in the list of favorites!`
            );
            err.status = 404;
            return next(err);
          }
        } else {
          err = new Error(`You don't have a list of favorites yet!`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
