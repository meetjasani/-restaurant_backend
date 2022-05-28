import express from 'express';
import { addCategory, addInvoice, addItem, addOrder, addSubCategory, addTable, customerController, deleteCategory, deleteInvoice, deleteItem, deleteOrder, deleteSubCategory, deleteTable, getCategory, getInvoice, getItem, getOrder, getSubCategory, getTable, loginController, registerUser, updateCategory, updateInvoice, updateItem, updateOrder, updateSubCategory, updateTable, waitingListController, getUsers, updateUser, functionalityController, licenseController, roleController, licenseStringController, emailSettingController, templetSettingController, smsSettingController, licenseDefaultController } from '../controller';
import { auth } from "../middleware";

const router = express.Router();

//User Routes
router.post('/register', auth, registerUser.register);
router.post('/login', loginController.login);
router.post('/logout', loginController.logout);
router.get('/user', auth, getUsers.getAll);
router.get('/user/getuser', auth, getUsers.getUser);
router.get('/user/l', auth, getUsers.getUserList);
router.get('/user/:name', auth, getUsers.userNameAvailable);
router.patch('/user', auth, updateUser.update);
router.patch('/user/p', auth, updateUser.passwordChange);
router.delete('/user/:id', auth, updateUser.toggleEnable);

//Category Routes
router.post('/category', auth, addCategory.add);
router.patch('/category', auth, updateCategory.update);
router.get('/category', auth, getCategory.getAll);
router.get('/category/l', auth, getCategory.getAllForList);
router.delete('/category/:id', auth, deleteCategory.delete);

//Subcategory Routes
router.post('/subcategory', auth, addSubCategory.add);
router.patch('/subcategory', auth, updateSubCategory.update);
router.get('/subcategory', auth, getSubCategory.getAll);
router.get('/subcategory/l', auth, getSubCategory.getAllForList);
router.delete('/subcategory/:id', auth, deleteSubCategory.delete);

//Items Routes
router.post('/item', auth, addItem.add);
router.patch('/item', auth, updateItem.update);
router.get('/item', auth, getItem.getAll);
router.get('/item/a', auth, getItem.getAvailableItems);
router.get('/item/l', auth, getItem.getAvailableItemsList);
router.delete('/item/:id', auth, deleteItem.delete);

//Table Routes
router.post('/table', auth, addTable.add);
router.patch('/table', auth, updateTable.update);
router.get('/table', auth, getTable.getAll);
router.get('/table/a', auth, getTable.getAvailableTables);
router.delete('/table/:id', auth, deleteTable.delete);


//Order Routes
router.post('/order', auth, addOrder.add);
router.post('/order/t', auth, addOrder.addTakeAway);
router.patch('/order', auth, updateOrder.update);
router.patch('/order/w', auth, updateOrder.updateAttendantId);
router.patch('/order/t', auth, updateOrder.updateTakeAway);
router.patch('/order/delivered', auth, updateOrder.updateStatus);
router.get('/order', auth, getOrder.getAll);
router.get('/order/o', auth, getOrder.getOpenOrders);
router.get('/order/ao', auth, getOrder.getAllOpenOrders);
router.get('/order/ta', auth, getOrder.getOpenTakeAwayOrders);
router.get('/order/tas/:status', auth, getOrder.getTakeAwayOrdersByStatus);
router.get('/order/uo', auth, getOrder.getUnattendedOrders);
router.get('/order/:id', auth, getOrder.getOne);
router.delete('/order/:id', auth, deleteOrder.delete);

//Invoice Routes
router.post('/invoice', auth, addInvoice.add);
router.patch('/invoice', auth, updateInvoice.update);
router.get('/invoice', auth, getInvoice.getAll);
router.get('/invoice/g', auth, getInvoice.getGstInvoice);
router.delete('/invoice/:id', auth, deleteInvoice.delete);

//Functionality
router.post('/functionality', auth, functionalityController.add);
router.patch('/functionality', auth, functionalityController.update);
router.get('/functionality', auth, functionalityController.getAll);
router.get('/functionality/l', auth, functionalityController.getFunctionalityList);
router.get('/functionality/a', auth, functionalityController.getAllFunctionalityList);
router.delete('/functionality/:id', auth, functionalityController.delete);

//Role
router.post('/role', auth, roleController.add);
router.patch('/role', auth, roleController.update);
router.get('/role', auth, roleController.getAll);
router.get('/role/l', auth, roleController.getRoleList);
router.delete('/role/:id', auth, roleController.delete);

//Customer
router.post('/customer', auth, customerController.add);
router.patch('/customer', auth, customerController.update);
router.get('/customer', auth, customerController.getAll);
router.get('/customer/l', auth, customerController.getCustomerList);
router.delete('/customer/:id', auth, customerController.delete);


//Waiting List
router.post('/wlist', auth, waitingListController.add);
router.patch('/wlist', auth, waitingListController.update);
router.patch('/wlist/s', auth, waitingListController.updateStatus);
router.get('/wlist', auth, waitingListController.getAll);
router.get('/wlist/l', auth, waitingListController.getStatusWaiting);
router.delete('/wlist/:id', auth, waitingListController.delete);

//License
router.post('/license', auth, licenseController.add);
router.patch('/license', auth, licenseController.update);
router.get('/license', auth, licenseController.getAll);
router.delete('/license/:id', auth, licenseController.delete);

//LicenseString
router.post('/licString', auth, licenseStringController.add);
router.patch('/licString', auth, licenseStringController.update);
router.get('/licString', auth, licenseStringController.getAll);
router.delete('/licString/:id', auth, licenseStringController.delete);

//Email Settings
router.post('/email', auth, emailSettingController.add);
router.patch('/email', auth, emailSettingController.update);
router.get('/email', auth, emailSettingController.getAll);
router.delete('/email/:id', auth, emailSettingController.delete);

//Templet Settings
router.post('/templet', auth, templetSettingController.add);
router.patch('/templet', auth, templetSettingController.update);
router.get('/templet', auth, templetSettingController.getAll);
router.delete('/templet/:id', auth, templetSettingController.delete);

//Templet Settings
router.post('/sms', auth, smsSettingController.add);
router.patch('/sms', auth, smsSettingController.update);
router.get('/sms', auth, smsSettingController.getAll);
router.delete('/sms/:id', auth, smsSettingController.delete);

//License Default
router.patch('/default', auth, licenseDefaultController.update);
router.get('/default', auth, licenseDefaultController.getAll);

export default router;