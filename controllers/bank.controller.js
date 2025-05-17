import db from "../database/index.js";
import { successResponse, createError } from "../utils/response.util.js";

export const getloan = async (req, res, next) => {
  const { loan_type, loan_amount, interest_rate, term_period } = req.body;
  // console.log(loan_type, loan_amount, interest_rate, term_period);
  try {
    if (!loan_amount || !loan_type || !interest_rate || !term_period) {
      return next(
        createError(
          "All fields are required: loan_amount, loan_type, interest_rate, term_period",
          400
        )
      );
    }

    const income = req.user.annual_income;
    const credit_score = req.user.credit_score;

    if (credit_score < 450) {
      return next(createError("Insufficient Credit_Score", 400));
    }
    //checking the credit score

    if (income < 150000) {
      return next(createError("Insufficient Income", 400));
    }

    if (loan_amount > 5000) {
      return next(createError("Max of 5000/- will be disbursed", 400));
    }

    if (interest_rate < 12) {
      return next(createError("Interest rate should be greater than 12%", 400));
    }

    let due_dates = [];
    let principal_amount = loan_amount;
    let emi_amount = 0;
    for(let i = 0 ; i < term_period ; i++){
      let monthly_interest = ( principal_amount * interest_rate ) / 1200;
      //calculating the monthly interest
      let montly_principale = (principal_amount * 0.03);
      let monthly_due = monthly_interest + montly_principale;
      if(i === 0){
        emi_amount = monthly_due;
      }
      due_dates.push({
        due_date : new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000) + 15 * 24 * 60 * 60 * 1000),
        due_amount : monthly_due
      });
      principal_amount -= montly_principale;
    }

    if(emi_amount > 0.2 * income){
      return next(createError("EMI should be less than 20% of your income", 400));
    }

    const loan_object = await db.query(
      "INSERT INTO loans (Aadhar_id , loan_amount , interest_rate , term_period , disbursement_date , principal_balance , status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",[req.user.aadhar_id , loan_amount , interest_rate , term_period , new Date(Date.now()) , loan_amount , "DUE"] 
    );

    const loan_id = loan_object.rows[0].loan_id;
    principal_amount = loan_amount;
    for(let i = 0 ; i < term_period ; i++){
      let monthly_interest = ( principal_amount * interest_rate ) / 1200;
      let montly_principale = (principal_amount * 0.03);
      let monthly_due = monthly_interest + montly_principale;
      // due_dates.push({
      //   due_date : new Date(Date.now() + (i * 15 * 24 * 60 * 60 * 1000)),
      //   due_amount : monthly_due
      // });
      let billing_date = new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000));
      let due_date = new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000) + 15 * 24 * 60 * 60 * 1000);
      await db.query("INSERT INTO emi_schedules (loan_id , billing_date , due_date , amount_due , paid_amount , status) VALUES ($1 , $2 , $3 , $4 , $5 , $6)", [
        loan_id,
        billing_date,
        due_date,
        monthly_due,
        0,
        "DUE"
        ]
      );
      principal_amount -= montly_principale;
    }

    await db.query("INSERT INTO transactions (aadhar_id , loan_id , txn_type , amount , date) VALUES ($1, $2, $3, $4, $5)", [req.user.aadhar_id,loan_id , "CREDIT" , loan_amount , new Date(Date.now())]);

    res.status(200).json(
      successResponse(
        {
          loan_id,
          due_dates
        }
        ,"Loan disbursed successfully",
        200
      )
    )
  } catch (error) {
    next(error);
  }
};

export const makePayment = async (req,res,next) => {
  const {loan_id , paid_amount} = req.body;
  if(!loan_id){
    return next(createError("Loan ID is required", 400));
  }

  try {
    const loan_object = await db.query("SELECT * FROM loans WHERE loan_id = $1", [loan_id]);
    if(loan_object.rowCount === 0){
      return next(createError("Loan not found", 404));
    }
    const loan = loan_object.rows[0];
    if(loan.status !== "DUE"){
      return next(createError("Loan is already paid", 400));
    }

    const result1 = await db.query(
    "SELECT * FROM emi_schedules WHERE loan_id = $1",
    [loan_id]
    );

    // console.log(result1.rows);

    let emi_object ;
    for(let i = 0 ; i < result1.rowCount ; i++){
      const emi = result1.rows[i];
      // console.log(emi);
      if(emi.due_date > new Date(Date.now()) && emi.billing_date <= new Date(Date.now()) &&  emi.status === "DUE"){
        emi_object = emi;
        break;
      }
    } 

    if(emi_object === undefined){
      return next(createError("No EMI due", 400));
    }
    // console.log(emi_object);
    const emi = emi_object;
    const amount_due = emi.amount_due;
    if(paid_amount < amount_due){
      return next(createError("Paid amount should be greater than or equal to due amount:" + amount_due, 400));
    }

    await db.query("UPDATE emi_schedules SET paid_amount = $1 , status = $2 WHERE loan_id = $3 AND emi_id = $4", [paid_amount , "PAID" , loan_id , emi.emi_id]);
    
    let new_status = "DUE";
    if(emi_object.rowCount === 1){
      new_status = "PAID";
      await db.query("UPDATE loans SET status = $1 WHERE loan_id = $2", [new_status , loan_id]);
    }
    

    await db.query("INSERT INTO transactions (aadhar_id , loan_id , txn_type , amount , date) VALUES ($1, $2, $3, $4, $5)", [req.user.aadhar_id,loan_id , "DEBIT" , paid_amount , new Date(Date.now())]);

    res.status(200).json(successResponse({} ,"Payment made successfully" , 200));
  } catch (error) {
    console.log(error);
    next(error);
  }
}


export const getStatement = async (req,res,next) => {
  const {loan_id} = req.body;
  if(!loan_id){
    return next(createError("Loan ID is required", 400));
  }

  try {
    const loan_object = await db.query("SELECT * FROM loans WHERE loan_id = $1", [loan_id]);
    if(loan_object.rowCount === 0){
      return next(createError("Loan not found", 400));
    }
    const loan = loan_object.rows[0];
    if(loan.status !== "DUE"){
      return next(createError("Loan is already paid", 400));
    }

    const result1 = await db.query(
    "SELECT * FROM transactions WHERE loan_id = $1",
    [loan_id]
    );

    const result2 = await db.query(
      "SELECT * FROM emi_schedules WHERE loan_id = $1",
      [loan_id]
    );

    // console.log(result1.rows);

    let statement = [];
    for(let i = 0 ; i < result1.rowCount ; i++){
      const transaction = result1.rows[i];
      statement.push({
        txn_id : transaction.id,
        txn_type : transaction.txn_type,
        amount : transaction.amount,
        date : transaction.date
      });
    }

    let upcoming_emis = [];
    for(let i = 0 ; i < result2.rowCount ; i++){
      const emi = result2.rows[i];
      if(emi.due_date > new Date(Date.now())){
        upcoming_emis.push({
          emi_id : emi.emi_id,
          amount_due : emi.amount_due,
          due_date : emi.due_date
        });
      }
    }

    const resp = {
      "transcation_history" : statement,
      "upcoming_emis" : upcoming_emis
    }
    
    res.status(200).json(successResponse(resp ,"Statement fetched successfully" , 200));
  } catch (error) {
    console.log(error);
    next(error);
  }
}