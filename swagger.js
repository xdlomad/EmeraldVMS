/**
 * @swagger
 * tags:
 *   - name: Login
 *     description: Login as admin, security, or resident. Register as a new resident.
 *   - name: Manage Users
 *     description: only available to admin
 *   - name: Manage Visitors
 *     description: available to admin, security, and residents
 *   - name: Manage Visitor Logs
 *     description: available to admin and security
 */

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *      - Login
 *     summary: Perform user login
 *     description: Endpoint for user authentication
 *     requestBody:
 *      description: User login information
 *      required: true
 *      content:
 *        application/json:
 *         schema:
 *          type: object
 *          properties:
 *            user_id:
 *              type: string
 *            password:
 *              type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       201:
 *         description: User logged in failure
 */

/**
 * @swagger
 * /registerResident:
 *   post:
 *     tags:
 *      - Login
 *     summary: New Resident registering
 *     description: Register as a new user with the provided information.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             user_id: "new_user"
 *             password: "password123"
 *             name: "John Doe"
 *             unit: "Apartment A"
 *             hp_num: "+123456789"
 *     responses:
 *       200:
 *         description: Successful response. Please wait for admin to approve registration.
 *       400:
 *         description: Bad Request. User already exists.
 *       401:
 *         description: Unauthorized. Token not valid.
 *       403:
 *         description: Forbidden. User does not have access to registering users.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 */

/**
 * @swagger
 * /test/registerResident:
 *   post:
 *     tags:
 *      - Login
 *     summary: New Resident registering
 *     description: this work as normal as register resident but for testing purposes and does not require admin approval
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             user_id: "new_user"
 *             password: "password123"
 *             name: "John Doe"
 *             unit: "Apartment A"
 *             hp_num: "+123456789"
 *     responses:
 *       200:W
 *         description: Successful response.
 *       400:
 *         description: Bad Request. User already exists.
 *       401:
 *         description: Unauthorized. Token not valid.
 *       403:
 *         description: Forbidden. User does not have access to registering users.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 */

/**
 * @swagger
 * /finduser/{name}:
 *   get:
 *     tags:
 *      - Manage Users
 *     summary: Find user information
 *     description: Retrieve user information based on the provided criteria.
 *     security:
 *       - BearerAuth: [] 
 *     parameters:
 *      - in: path
 *        name: name
 *        required: true
 *        type: string
 *        description: the name
 *     responses:
 *       200:
 *         description: Successful response. User information retrieved.
 *       401:
 *         description: Unauthorized. Token not valid.
 *       403:
 *         description: Forbidden. User does not have access to finding users.
 *       404:
 *         description: User not found. The specified user_id does not exist.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 */


/**
 * @swagger
 * /registeruser:
 *   post:
 *     tags:
 *      - Manage Users
 *     summary: Register a new user
 *     description: Register a new user with the provided information.
 *     security:
 *       - BearerAuth: []  # Use the security scheme defined in your Swagger definition for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             user_id: "new_user"
 *             password: "password123"
 *             name: "John Doe"
 *             unit: "Apartment A"
 *             hp_num: "+123456789"
 *             role: "admin"
 *     responses:
 *       200:
 *         description: Successful response. User registered successfully.
 *       400:
 *         description: Bad Request. User already exists.
 *       401:
 *         description: Unauthorized. Token not valid.
 *       403:
 *         description: Forbidden. User does not have access to registering users.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 */


/**
 * @swagger
 * /updateuser:
 *   patch:
 *     tags:
 *      - Manage Users
 *     summary: Update user information
 *     description: Update user information based on the provided data.
 *     security:
 *       - BearerAuth: []  # Use the security scheme defined in your Swagger definition for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             user_id: "existing_user"
 *             password: "new_password"
 *             name: "Updated Name"
 *             unit: "Updated Unit"
 *             hp_num: "+987654321"
 *             role: "admin"
 *     responses:
 *       200:
 *         description: Successful response. User information updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "User updated! Updated Name"
 *       400:
 *         description: Bad Request. User does not exist.
 *       401:
 *         description: Unauthorized. Token not valid.
 *       403:
 *         description: Forbidden. User does not have access to update user information.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 */


/**
 * @swagger
 * /deleteuser:
 *   delete:
 *     tags:
 *      - Manage Users
 *     summary: Delete a user
 *     description: Delete a user based on the provided user_id.
 *     security:
 *       - BearerAuth: []  # Use the security scheme defined in your Swagger definition for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             user_id: "user_to_delete"
 *     responses:
 *       200:
 *         description: Successful response. User deleted successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "User deleted user_to_delete"
 *       400:
 *         description: Bad Request. Cannot find the user to delete.
 *       401:
 *         description: Unauthorized. Token not valid.
 *       403:
 *         description: Forbidden. User does not have access to delete users.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 */


/**
 * @swagger
 * /checkPendings:
 *   get:   
 *     tags:
 *      - Manage Users
 *     security:
 *       - BearerAuth: [] 
 *     summary: Checking pending registration request
 *     description: Check pending registration as a new residents requests as admin.
 *     responses:
 *       200:
 *         description: Shows list of pending registration requests.
 *       400:
 *         description: No pending registration request.
 *       401:
 *         description: Unauthorized. Token not valid.
 *       403:
 *         description: Forbidden. User does not have access to registering users.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 */


/**
 * @swagger
 * /findvisitor/{ref_num}:
 *   get:
 *     tags:
 *      - Manage Visitors
 *     summary: Find visitors based on criteria
 *     description: Retrieve a list of visitors based on the provided criteria. Only residents can find their own visitors. Leave the space blank,if a list of visitors is needed
 *     security:
 *       - BearerAuth: []  # Use the security scheme defined in your Swagger definition for authentication
 *     parameters:
 *      - in: path
 *        name: ref_num
 *        type: string
 *        description: The ref_num.
 *     responses:
 *       200:
 *         description: Successful response. List of visitors matching the criteria.
 *       404:
 *         description: Visitor not found.
 *       401:
 *         description: Unauthorized. Token not valid.
 */


/**
 * @swagger
 * /registervisitor:
 *   post:
 *     tags:
 *      - Manage Visitors
 *     summary: Register a new visitor
 *     description: Register a new visitor based on the provided data.
 *     security:
 *       - BearerAuth: []  # Use the security scheme defined in your Swagger definition for authentication
 *     requestBody:
 *      description: User ID info
 *      required: true
 *      content:
 *        application/json:
 *         schema:
 *          type: object
 *          properties:
 *            ref_num:
 *              type: string
 *              example: "615671031"
 *            name:
 *              type: string
 *              example: "zenitsu"
 *            IC_num:
 *              type: string
 *              example: "111131-07-6121"
 *            car_num:
 *              type: string
 *              example: "UTeM 5555"
 *            hp_num:
 *              type: string
 *              example: "012-61942211"
 *            pass:
 *              type: string
 *              example: "DELIVERY_0A"
 *            category:
 *              type: string
 *              example: "DELIVERY"
 *            visit_date:
 *              type: string
 *              example: "2023-06-30"
 *            unit:
 *              type: string
 *              example: "T-7-4"
 *     responses:
 *       200:
 *         description: Successful response. Visitor registered successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Registration request processed, visitor is Visitor Name"
 *       400:
 *         description: Bad Request. Visitor with the provided reference number already exists.
 *       401:
 *         description: Unauthorized. Token not valid.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 */


/**
 * @swagger
 * /updatevisitor:
 *   patch:
 *     tags:
 *      - Manage Visitors
 *     summary: Update visitor information based on criteria
 *     description: Update information except for ref_num as ref_num is used for identification of the information. Only residents and security can update their own visitors, while admin can update any visitor.
 *     security:
 *       - BearerAuth: []  # Use the security scheme defined in your Swagger definition for authentication
 *     requestBody:
 *      description: User ID info
 *      required: true
 *      content:
 *        application/json:
 *         schema:
 *          type: object
 *          properties:
 *            ref_num:
 *              type: string
 *              example: "615671031"
 *            name:
 *              type: string
 *              example: "891004-07-0110"
 *            IC_num:
 *              type: string
 *              example: "01109876123"
 *            car_num:
 *              type: string
 *              example: "WWW7777"
 *            hp_num:
 *              type: string
 *              example: "+987654321"
 *            pass:
 *              type: string
 *              example: "SERVICE-B"
 *            category:
 *              type: string
 *              example: "Maintenance"
 *            visit_date:
 *              type: string
 *              example: "2023-09-12"
 *            unit:
 *              type: string
 *              example: "SWIMMING POOL"
 *     responses:
 *       200:
 *         description: Successful response. Visitor information updated.
 *         content:
 *           application/json:
 *             example:
 *               name: "Updated Visitor Name"
 *               IC_num: "IC654321"
 *               car_num: "XYZ789"
 *               hp_num: "+987654321"
 *               pass: true
 *               category: "Contractor"
 *               visit_date: "2023-12-31"
 *               unit: "B303"
 *       401:
 *         description: Unauthorized. Token not valid.
 *       404:
 *         description: Visitor not found.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 */


/**
 * @swagger
 * /deletevisitor:
 *   delete:
 *     tags:
 *       - Manage Visitors
 *     summary: Delete a visitor
 *     description: Delete a visitor based on the reference number. Only residents and security can delete their own visitors, while admin can delete any visitor.
 *     security:
 *       - BearerAuth: []  # Use the security scheme defined in your Swagger definition for authentication
 *     requestBody:
 *      description: User ID info
 *      required: true
 *      content:
 *        application/json:
 *         schema:
 *          type: object
 *          properties:
 *            ref_num:
 *              type: string
 *              example: "647112110" 
 *     responses:
 *       200:
 *         description: Successful response. Visitor deleted.
 *         content:
 *           application/json:
 *             example:
 *               message: "The visitor under reference number of visitor_reference_number has been deleted :D!"
 *       401:
 *         description: Unauthorized. Token not valid.
 *       404:
 *         description: Visitor not found.
 *       500:
 *         description: Internal Server Error. Something went wrong on the server.
 */


/**
 * @swagger
 * /visitorPass/{IC_num}:
 *   get:
 *     tags:
 *       - Manage Visitors
 *     security:
 *       - BearerAuth: [] 
 *     summary: Create QR code for visitor
 *     description: |
 *       Create a QR code for a visitor based on their IC number.
 *       The QR code contains visitor information such as reference number, name, category, and contact number.
 *     parameters:
 *      - in: path
 *        name: IC_num
 *        required: true
 *        type: string
 *        description: The IC_NUM.
 *     responses:
 *       200:
 *         description: QR code created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 qrCodeUrl:
 *                   type: string
 *                   format: uri
 *                   description: URL to the generated QR code
 *       400:
 *         description: Invalid request or visitor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */



/**
 * @swagger
 * /checkIn:
 *   post:
 *     tags:
 *       - Manage Visitor Logs
 *     security:
 *       - BearerAuth: [] 
 *     summary: Create a visitor log
 *     description: |
 *       Create a visitor log for check-in. Only security and admin roles are allowed to create logs.
 *     requestBody:
 *       description: Visitor log information for check-in
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               log_id:
 *                 type: string
 *                 description: Unique log ID
 *                 example: "3" 
 *               ref:
 *                 type: string
 *                 description: Reference number of the visitor
 *                 example: "672831021"
 *     responses:
 *       200:
 *         description: Visitor log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 logData:
 *                   type: object
 *                   description: Created visitor log data
 *       400:
 *         description: Invalid request or duplicate log ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       401:
 *         description: Invalid token
 */


/**
 * @swagger
 * /findvisitorlog:
 *   post:
 *     tags:
 *       - Manage Visitor Logs
 *     security:
 *       - BearerAuth: [] 
 *     summary: Find visitor logs
 *     description: |
 *       Find visitor logs based on specified criteria. Only security and admin roles are allowed to find logs.
 *     requestBody:
 *       description: Visitor log information for check-in
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               log_id:
 *                 type: string
 *                 description: Unique log ID
 *     responses:
 *       200:
 *         description: Visitor logs found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   log_id:
 *                     type: string
 *                     description: Unique log ID
 *                   ref_num:
 *                     type: string
 *                     description: Reference number of the visitor
 *                   CheckIn_Time:
 *                     type: string
 *                     format: date-time
 *                     description: Check-in time
 *                   CheckOut_Time:
 *                     type: string
 *                     format: date-time
 *                     description: Check-out time
 *                   user_id:
 *                     type: string
 *                     description: User ID associated with the log
 *       400:
 *         description: Invalid request or insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */


/**
 * @swagger
 * /checkOut:
 *   patch:
 *     tags:
 *       - Manage Visitor Logs
 *     security:
 *       - BearerAuth: [] 
 *     summary: Update a visitor log to checkout visitor
 *     description: |
 *       Update the specified visitor log to mark the visitor as checked out. Only security and admin roles are allowed to update logs.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               log_id:
 *                 type: string
 *                 description: Log ID of the visitor log to update
 *             required:
 *               - log_id
 *     responses:
 *       200:
 *         description: Visitor log updated successfully
 *       400:
 *         description: Invalid request or insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

