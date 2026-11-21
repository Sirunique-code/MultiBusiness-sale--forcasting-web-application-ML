from flask import Blueprint, request, jsonify
from app.models import db, Business
from app.utils.auth import token_required

business_bp = Blueprint('business', __name__)

@business_bp.route('', methods=['GET'])
@token_required
def get_businesses(current_user):
    if current_user.is_admin:
        businesses = Business.query.order_by(Business.created_at.desc()).all()
    else:
        user_businesses = Business.query.filter_by(user_id=current_user.id).order_by(Business.created_at.desc()).all()
        businesses = user_businesses if user_businesses else Business.query.order_by(Business.created_at.desc()).all()
        
    return jsonify({'businesses': [b.to_dict() for b in businesses]}), 200

@business_bp.route('', methods=['POST'])
@token_required
def create_business(current_user):

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    industry = data.get('industry', '').strip()
    description = data.get('description', '').strip()

    if not name:
        return jsonify({'error': 'Business name is required'}), 400

    business = Business(
        user_id=current_user.id,
        name=name,
        industry=industry,
        description=description
    )

    db.session.add(business)
    db.session.commit()

    return jsonify({
        'message': 'Business created successfully',
        'business': business.to_dict()
    }), 201

@business_bp.route('/<int:business_id>', methods=['GET'])
@token_required
def get_business(current_user, business_id):
    if current_user.is_admin:
        business = Business.query.filter_by(id=business_id).first()
    else:
        business = Business.query.filter_by(id=business_id, user_id=current_user.id).first() or Business.query.filter_by(id=business_id).first()
    if not business:
        return jsonify({'error': 'Business not found'}), 404

    return jsonify({'business': business.to_dict()}), 200

@business_bp.route('/<int:business_id>', methods=['PUT'])
@token_required
def update_business(current_user, business_id):
    if current_user.is_admin:
        business = Business.query.filter_by(id=business_id).first()
    else:
        business = Business.query.filter_by(id=business_id, user_id=current_user.id).first()
    if not business:
        return jsonify({'error': 'Business not found or access denied'}), 404

    data = request.get_json() or {}
    if 'name' in data and data['name'].strip():
        business.name = data['name'].strip()
    if 'industry' in data:
        business.industry = data['industry'].strip()
    if 'description' in data:
        business.description = data['description'].strip()

    db.session.commit()
    return jsonify({
        'message': 'Business updated successfully',
        'business': business.to_dict()
    }), 200

@business_bp.route('/<int:business_id>', methods=['DELETE'])
@token_required
def delete_business(current_user, business_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Administrator privileges required to delete business profiles'}), 403

    business = Business.query.filter_by(id=business_id).first()
    if not business:
        return jsonify({'error': 'Business not found'}), 404

    db.session.delete(business)
    db.session.commit()
    return jsonify({'message': 'Business deleted successfully'}), 200

