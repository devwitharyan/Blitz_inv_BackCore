const categoryModel = require('../models/category.model');
const { success, error } = require('../utils/response');

exports.listCategories = async (req, res) => {
  try {
    const data = await categoryModel.getAll();
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const data = await categoryModel.create({
      name,
      description,
    });

    return success(res, data, 'Category created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await categoryModel.update(id, req.body);

    return success(res, updated, 'Category updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await categoryModel.remove(id);
    return success(res, null, 'Category deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
